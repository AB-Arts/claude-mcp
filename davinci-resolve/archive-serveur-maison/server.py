#!/usr/bin/env python
"""
DaVinci Resolve MCP server (stdio) - zero third-party dependency.

Uses ONLY:
  * the official Blackmagic scripting API (DaVinciResolveScript / fusionscript.dll)
  * the Python standard library (the MCP stdio protocol is JSON-RPC 2.0, one JSON
    message per line, implemented below by hand)

Requirements
  * DaVinci Resolve **Studio** running on this machine (external scripting is a
    Studio feature) with Preferences > System > General > "External scripting
    using" = Local.
  * Python >= 3.6 64-bit.

Register in Claude Code (user scope):
  claude mcp add --scope user davinci-resolve -- "<python.exe>" "D:\\_CLAUDE\\.MCP\\DaVinciResolve\\server.py"
"""
import contextlib
import io
import json
import os
import subprocess
import sys
import time
import traceback

SERVER_NAME = "davinci-resolve"
SERVER_VERSION = "1.0.0"

RESOLVE_EXE = r"C:\Program Files\Blackmagic Design\DaVinci Resolve\Resolve.exe"
API_DIR = os.environ.get(
    "RESOLVE_SCRIPT_API",
    r"C:\ProgramData\Blackmagic Design\DaVinci Resolve\Support\Developer\Scripting",
)
LIB_PATH = os.environ.get(
    "RESOLVE_SCRIPT_LIB",
    r"C:\Program Files\Blackmagic Design\DaVinci Resolve\fusionscript.dll",
)
os.environ["RESOLVE_SCRIPT_API"] = API_DIR
os.environ["RESOLVE_SCRIPT_LIB"] = LIB_PATH
sys.path.append(os.path.join(API_DIR, "Modules"))

# Protocol messages go to the REAL stdout. Anything else printed (by us, by the
# Resolve library or by user code) is diverted to stderr so it can never corrupt
# the JSON-RPC stream.
_PROTO_OUT = sys.stdout.buffer
sys.stdout = sys.stderr

_dvr = None
_resolve = None


class ToolError(Exception):
    pass


# --------------------------------------------------------------------------- #
# Connection helpers
# --------------------------------------------------------------------------- #
def _dvr_module():
    global _dvr
    if _dvr is None:
        import DaVinciResolveScript as dvr  # official module shipped with Resolve
        _dvr = dvr
    return _dvr


def get_resolve(required=True):
    """Return a live `resolve` object, reconnecting if needed."""
    global _resolve
    if _resolve is not None:
        try:
            if _resolve.GetProductName():
                return _resolve
        except Exception:
            pass
        _resolve = None
    try:
        _resolve = _dvr_module().scriptapp("Resolve")
    except Exception as exc:  # library missing etc.
        if required:
            raise ToolError("Cannot load the Resolve scripting library: %s" % exc)
        return None
    if _resolve is None and required:
        raise ToolError(
            "DaVinci Resolve is not reachable. Start it first (tool resolve_launch). "
            "If it is already open: it must be the Studio edition and "
            "Preferences > System > General > 'External scripting using' must be 'Local'."
        )
    return _resolve


def resolve_running():
    try:
        out = subprocess.run(
            ["tasklist", "/FI", "IMAGENAME eq Resolve.exe", "/NH"],
            capture_output=True, text=True, timeout=15,
        ).stdout
        return "Resolve.exe" in out
    except Exception:
        return False


def get_project(required=True):
    pm = get_resolve().GetProjectManager()
    project = pm.GetCurrentProject()
    if project is None and required:
        raise ToolError("No project is open. Use project_open first.")
    return project


def get_timeline(name=None, required=True):
    project = get_project()
    if name:
        for i in range(1, project.GetTimelineCount() + 1):
            tl = project.GetTimelineByIndex(i)
            if tl.GetName() == name:
                return tl
        raise ToolError("Timeline '%s' not found." % name)
    tl = project.GetCurrentTimeline()
    if tl is None and required:
        raise ToolError("No current timeline. Use timeline_create first.")
    return tl


# --------------------------------------------------------------------------- #
# Generic helpers
# --------------------------------------------------------------------------- #
def plain(value, depth=0):
    """Convert Resolve return values into JSON-serialisable data."""
    if depth > 6:
        return repr(value)
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, dict):
        return {str(k): plain(v, depth + 1) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [plain(v, depth + 1) for v in value]
    return repr(value)


def timeline_fps(tl):
    raw = str(tl.GetSetting("timelineFrameRate") or "25")
    try:
        return float(raw.split()[0])
    except ValueError:
        return 25.0


def frames_to_tc(frames, fps):
    nominal = int(round(fps))
    frames = int(round(frames))
    f = frames % nominal
    s = (frames // nominal) % 60
    m = (frames // (nominal * 60)) % 60
    h = frames // (nominal * 3600)
    return "%02d:%02d:%02d:%02d" % (h, m, s, f)


def seconds_or_frames_to_abs(tl, seconds=None, frame=None, default_rel=0):
    """Timeline-relative seconds or frames -> absolute timeline frame."""
    fps = timeline_fps(tl)
    if frame is not None:
        rel = int(frame)
    elif seconds is not None:
        rel = int(round(float(seconds) * fps))
    else:
        rel = default_rel
    return tl.GetStartFrame() + rel


def iter_pool_clips(folder):
    for clip in folder.GetClipList() or []:
        yield clip
    for sub in folder.GetSubFolderList() or []:
        for clip in iter_pool_clips(sub):
            yield clip


def clip_info(clip):
    props = clip.GetClipProperty() or {}
    return {
        "name": clip.GetName(),
        "id": clip.GetUniqueId(),
        "type": props.get("Type"),
        "file_path": props.get("File Path"),
        "resolution": props.get("Resolution"),
        "fps": props.get("FPS"),
        "frames": props.get("Frames"),
        "duration": props.get("Duration"),
    }


def find_or_import_clip(ref):
    """`ref` = media-pool clip name, unique id, or an absolute file path."""
    project = get_project()
    mp = project.GetMediaPool()
    root = mp.GetRootFolder()
    norm = os.path.normcase(os.path.abspath(ref)) if os.path.isabs(ref) else None
    for clip in iter_pool_clips(root):
        if clip.GetName() == ref or clip.GetUniqueId() == ref:
            return clip
        if norm:
            fp = clip.GetClipProperty("File Path")
            if fp and os.path.normcase(os.path.abspath(fp)) == norm:
                return clip
    if norm and os.path.exists(ref):
        items = mp.ImportMedia([ref]) or []
        if items:
            return items[0]
        raise ToolError("Resolve refused to import '%s'." % ref)
    raise ToolError("Clip '%s' not found in the media pool (and not an existing file)." % ref)


def item_summary(item, track_type, track, index, fps, start0):
    start = item.GetStart()
    end = item.GetEnd()
    out = {
        "track_type": track_type,
        "track": track,
        "index": index,
        "id": item.GetUniqueId(),
        "name": item.GetName(),
        "start_frame": start - start0,
        "end_frame": end - start0,
        "duration_frames": item.GetDuration(),
        "start_seconds": round((start - start0) / fps, 3),
        "duration_seconds": round(item.GetDuration() / fps, 3),
    }
    if track_type == "video":
        try:
            out["fusion_comps"] = plain(item.GetFusionCompNameList())
        except Exception:
            pass
    return out


def find_item(tl, ref):
    """ref = {"id": uid} or {"track": n, "index": i, "track_type": "video"}."""
    if not isinstance(ref, dict):
        raise ToolError("item must be an object: {track, index} or {id}.")
    if ref.get("id"):
        for ttype in ("video", "audio", "subtitle"):
            for t in range(1, tl.GetTrackCount(ttype) + 1):
                for it in tl.GetItemListInTrack(ttype, t) or []:
                    if it.GetUniqueId() == ref["id"]:
                        return it
        raise ToolError("No timeline item with id %s." % ref["id"])
    ttype = ref.get("track_type", "video")
    track = int(ref.get("track", 1))
    index = int(ref.get("index", 1))
    items = tl.GetItemListInTrack(ttype, track) or []
    if not 1 <= index <= len(items):
        raise ToolError("Track %s %d has %d item(s); index %d is out of range." % (ttype, track, len(items), index))
    return items[index - 1]


def locate_item(tl, item):
    uid = item.GetUniqueId()
    for ttype in ("video", "audio", "subtitle"):
        for t in range(1, tl.GetTrackCount(ttype) + 1):
            for i, it in enumerate(tl.GetItemListInTrack(ttype, t) or [], start=1):
                if it.GetUniqueId() == uid:
                    return ttype, t, i
    return None, None, None


def first_comp(item):
    if item.GetFusionCompCount() < 1:
        raise ToolError("This timeline item has no Fusion composition.")
    return item.GetFusionCompByIndex(1)


def comp_tools(comp):
    tools = comp.GetToolList(False) or {}
    return [tools[k] for k in sorted(tools.keys())]


def find_tool(comp, name=None, reg_id=None):
    for tool in comp_tools(comp):
        attrs = tool.GetAttrs() or {}
        if name and attrs.get("TOOLS_Name") == name:
            return tool
        if not name and reg_id and attrs.get("TOOLS_RegID") == reg_id:
            return tool
    return None


def text_tools(comp):
    return [t for t in comp_tools(comp) if (t.GetAttrs() or {}).get("TOOLS_RegID") == "TextPlus"]


def hex_to_rgb(color):
    if isinstance(color, (list, tuple)) and len(color) >= 3:
        vals = [float(c) for c in color[:3]]
        if max(vals) > 1.0:
            vals = [v / 255.0 for v in vals]
        return vals
    c = str(color).lstrip("#")
    if len(c) == 3:
        c = "".join(ch * 2 for ch in c)
    if len(c) != 6:
        raise ToolError("Colour must be '#RRGGBB' or [r, g, b].")
    return [int(c[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]


def to_point(value):
    if isinstance(value, dict):
        return {1: float(value.get("x", value.get("1", 0.5))), 2: float(value.get("y", value.get("2", 0.5)))}
    if isinstance(value, (list, tuple)) and len(value) >= 2:
        return {1: float(value[0]), 2: float(value[1])}
    raise ToolError("Point values must be [x, y] (0..1, origin bottom-left).")


def set_tool_input(tool, name, value, frame=None):
    if isinstance(value, (list, tuple)) and len(value) in (2, 3) and all(isinstance(v, (int, float)) for v in value):
        value = to_point(value)
    if frame is None:
        tool.SetInput(name, value)
    else:
        tool.SetInput(name, value, float(frame))


def apply_text_style(tool, text=None, style=None):
    """Apply friendly style keys to a Text+ tool. Returns the list of applied keys."""
    applied = []
    if text is not None:
        tool.SetInput("StyledText", str(text))
        applied.append("StyledText")
    style = style or {}
    mapping = {
        "font": "Font",
        "font_style": "Style",
        "size": "Size",
        "tracking": "CharacterSpacing",
        "line_spacing": "LineSpacing",
    }
    for key, inp in mapping.items():
        if key in style and style[key] is not None:
            tool.SetInput(inp, style[key])
            applied.append(inp)
    if style.get("color") is not None:
        r, g, b = hex_to_rgb(style["color"])
        tool.SetInput("Red1", r)
        tool.SetInput("Green1", g)
        tool.SetInput("Blue1", b)
        applied.append("Color1")
    if style.get("position") is not None:
        tool.SetInput("Center", to_point(style["position"]))
        applied.append("Center")
    if style.get("h_anchor") is not None:  # 0 left, 1 center, 2 right
        tool.SetInput("HorizontalJustificationNew", int(style["h_anchor"]))
        applied.append("HorizontalJustificationNew")
    return applied


def animate_inputs(comp, tool, keyframes):
    """keyframes = {InputName: {frame: value, ...}}; frames are comp-relative."""
    done = {}
    for inp, keys in (keyframes or {}).items():
        if not isinstance(keys, dict) or not keys:
            raise ToolError("keyframes['%s'] must be an object {frame: value}." % inp)
        sample = next(iter(keys.values()))
        is_point = isinstance(sample, (list, tuple, dict))
        modifier = "XYPath" if is_point else "BezierSpline"
        try:
            tool.AddModifier(inp, modifier)
        except Exception:
            pass
        for frame, val in sorted(keys.items(), key=lambda kv: float(kv[0])):
            set_tool_input(tool, inp, to_point(val) if is_point else val, frame=float(frame))
        done[inp] = len(keys)
    return done


# --------------------------------------------------------------------------- #
# Tools
# --------------------------------------------------------------------------- #
def t_resolve_status(args):
    r = get_resolve(required=False)
    if r is None:
        return {"connected": False, "resolve_process_running": resolve_running()}
    info = {
        "connected": True,
        "product": r.GetProductName(),
        "version": r.GetVersionString(),
        "page": r.GetCurrentPage(),
    }
    project = r.GetProjectManager().GetCurrentProject()
    if project:
        info["project"] = project.GetName()
        info["project_settings"] = {
            k: project.GetSetting(k)
            for k in ("timelineResolutionWidth", "timelineResolutionHeight", "timelineFrameRate")
        }
        info["timelines"] = [project.GetTimelineByIndex(i).GetName() for i in range(1, project.GetTimelineCount() + 1)]
        tl = project.GetCurrentTimeline()
        info["current_timeline"] = tl.GetName() if tl else None
        info["rendering"] = bool(project.IsRenderingInProgress())
    return info


def t_resolve_launch(args):
    wait = float(args.get("wait_seconds", 180))
    if get_resolve(required=False) is not None:
        return t_resolve_status({})
    if not resolve_running():
        cmd = [RESOLVE_EXE] + (["-nogui"] if args.get("headless") else [])
        subprocess.Popen(cmd, close_fds=True, creationflags=getattr(subprocess, "DETACHED_PROCESS", 0))
    deadline = time.time() + wait
    while time.time() < deadline:
        if get_resolve(required=False) is not None:
            time.sleep(2)  # let the project manager finish loading
            return t_resolve_status({})
        time.sleep(3)
    raise ToolError("Resolve did not answer within %ss." % wait)


def t_project_open(args):
    name = args["name"]
    pm = get_resolve().GetProjectManager()
    current = pm.GetCurrentProject()
    created = False
    if current and current.GetName() == name:
        project = current
    else:
        project = pm.LoadProject(name)
        if project is None:
            if not args.get("create_if_missing", True):
                raise ToolError("Project '%s' does not exist in the current folder." % name)
            project = pm.CreateProject(name)
            if project is None:
                raise ToolError("Could not create project '%s' (name already used in another folder?)." % name)
            created = True
    applied = {}
    settings = {
        "timelineResolutionWidth": args.get("width"),
        "timelineResolutionHeight": args.get("height"),
        "timelineFrameRate": args.get("fps"),
    }
    for key, val in settings.items():
        if val is None:
            continue
        if key == "timelineFrameRate" and float(val) == int(float(val)):
            val = int(float(val))
        applied[key] = bool(project.SetSetting(key, str(val)))
    return {
        "project": project.GetName(),
        "created": created,
        "settings_applied": applied,
        "settings_now": {k: project.GetSetting(k) for k in settings},
        "note": "Frame rate can only be changed before any timeline uses media." if applied else None,
    }


def t_project_save(args):
    ok = get_resolve().GetProjectManager().SaveProject()
    return {"saved": bool(ok), "project": get_project().GetName()}


def t_media_import(args):
    paths = args.get("paths") or []
    if not paths:
        raise ToolError("paths is empty.")
    missing = [p for p in paths if not os.path.exists(p)]
    if missing:
        raise ToolError("These paths do not exist: %s" % missing)
    mp = get_project().GetMediaPool()
    if args.get("bin"):
        root = mp.GetRootFolder()
        target = None
        for sub in root.GetSubFolderList() or []:
            if sub.GetName() == args["bin"]:
                target = sub
                break
        if target is None:
            target = mp.AddSubFolder(root, args["bin"])
        mp.SetCurrentFolder(target)
    items = mp.ImportMedia(paths) or []
    return {"imported": [clip_info(c) for c in items]}


def t_media_list(args):
    root = get_project().GetMediaPool().GetRootFolder()
    return {"clips": [clip_info(c) for c in iter_pool_clips(root)]}


def t_timeline_create(args):
    name = args["name"]
    project = get_project()
    mp = project.GetMediaPool()
    for i in range(1, project.GetTimelineCount() + 1):
        tl = project.GetTimelineByIndex(i)
        if tl.GetName() == name:
            if args.get("replace"):
                mp.DeleteTimelines([tl])
                break
            project.SetCurrentTimeline(tl)
            return {"timeline": name, "created": False, "note": "Existing timeline opened (pass replace=true to rebuild it)."}
    clips = [find_or_import_clip(c) for c in (args.get("clips") or [])]
    if clips:
        tl = mp.CreateTimelineFromClips(name, clips)
    else:
        tl = mp.CreateEmptyTimeline(name)
    if tl is None:
        raise ToolError("Resolve could not create timeline '%s'." % name)
    project.SetCurrentTimeline(tl)
    return {"timeline": tl.GetName(), "created": True, "fps": timeline_fps(tl),
            "start_timecode": tl.GetStartTimecode()}


def t_timeline_append(args):
    tl = get_timeline(args.get("timeline"))
    get_project().SetCurrentTimeline(tl)
    mp = get_project().GetMediaPool()
    infos = []
    for spec in args.get("clips") or []:
        if isinstance(spec, str):
            spec = {"clip": spec}
        clip = find_or_import_clip(spec["clip"])
        info = {"mediaPoolItem": clip}
        if spec.get("source_start_frame") is not None:
            info["startFrame"] = int(spec["source_start_frame"])
        if spec.get("source_end_frame") is not None:
            info["endFrame"] = int(spec["source_end_frame"])
        if "startFrame" in info and "endFrame" not in info:
            info["endFrame"] = int(clip.GetClipProperty("Frames") or 0) - 1
        if "endFrame" in info and "startFrame" not in info:
            info["startFrame"] = 0
        if spec.get("track") is not None:
            info["trackIndex"] = int(spec["track"])
        if spec.get("at_seconds") is not None or spec.get("at_frame") is not None:
            info["recordFrame"] = seconds_or_frames_to_abs(tl, spec.get("at_seconds"), spec.get("at_frame"))
        if spec.get("media_type") is not None:
            info["mediaType"] = int(spec["media_type"])
        infos.append(info)
    if not infos:
        raise ToolError("clips is empty.")
    items = mp.AppendToTimeline(infos) or []
    fps = timeline_fps(tl)
    out = []
    for it in items:
        ttype, t, i = locate_item(tl, it)
        out.append(item_summary(it, ttype or "video", t, i, fps, tl.GetStartFrame()))
    return {"appended": out}


def t_timeline_info(args):
    tl = get_timeline(args.get("timeline"))
    fps = timeline_fps(tl)
    start0 = tl.GetStartFrame()
    tracks = {}
    for ttype in ("video", "audio", "subtitle"):
        lst = []
        for t in range(1, tl.GetTrackCount(ttype) + 1):
            items = tl.GetItemListInTrack(ttype, t) or []
            lst.append({
                "track": t,
                "name": tl.GetTrackName(ttype, t),
                "items": [item_summary(it, ttype, t, i, fps, start0) for i, it in enumerate(items, start=1)],
            })
        tracks[ttype] = lst
    return {
        "timeline": tl.GetName(),
        "fps": fps,
        "resolution": [tl.GetSetting("timelineResolutionWidth"), tl.GetSetting("timelineResolutionHeight")],
        "start_timecode": tl.GetStartTimecode(),
        "duration_frames": tl.GetEndFrame() - start0,
        "duration_seconds": round((tl.GetEndFrame() - start0) / fps, 3),
        "playhead": tl.GetCurrentTimecode(),
        "tracks": tracks,
    }


def t_timeline_delete_items(args):
    tl = get_timeline(args.get("timeline"))
    items = [find_item(tl, ref) for ref in args.get("items") or []]
    if not items:
        raise ToolError("items is empty.")
    ok = tl.DeleteClips(items, bool(args.get("ripple", False)))
    return {"deleted": bool(ok), "count": len(items)}


def _ensure_video_tracks(tl, n):
    while tl.GetTrackCount("video") < n:
        if not tl.AddTrack("video"):
            break


def t_title_add(args):
    r = get_resolve()
    project = get_project()
    tl = get_timeline(args.get("timeline"))
    project.SetCurrentTimeline(tl)
    template = args.get("template", "Text+")
    fps = timeline_fps(tl)
    start_abs = seconds_or_frames_to_abs(tl, args.get("start_seconds"), args.get("start_frame"))
    duration = None
    if args.get("duration_seconds") is not None:
        duration = int(round(float(args["duration_seconds"]) * fps))
    elif args.get("duration_frames") is not None:
        duration = int(args["duration_frames"])
    track = int(args.get("track", 2))

    r.OpenPage("edit")
    _ensure_video_tracks(tl, track)
    # Lock every other video track so the title lands on the requested one.
    locks = {}
    for t in range(1, tl.GetTrackCount("video") + 1):
        locks[t] = bool(tl.GetIsTrackLocked("video", t))
        tl.SetTrackLock("video", t, t != track)
    try:
        if duration:
            tl.SetMarkInOut(start_abs, start_abs + duration - 1, "all")
        tl.SetCurrentTimecode(frames_to_tc(start_abs, fps))
        item = tl.InsertFusionTitleIntoTimeline(template)
    finally:
        for t, was in locks.items():
            tl.SetTrackLock("video", t, was)
        if duration:
            tl.ClearMarkInOut("all")
    if item is None:
        raise ToolError("Resolve could not insert the Fusion title '%s' (check the exact template name)." % template)

    comp = first_comp(item)
    texts = text_tools(comp)
    applied = []
    if texts:
        comp.Lock()
        try:
            applied = apply_text_style(texts[0], args.get("text"), args.get("style"))
            for name, val in (args.get("inputs") or {}).items():
                set_tool_input(texts[0], name, val)
                applied.append(name)
            anim = animate_inputs(comp, texts[0], args.get("keyframes")) if args.get("keyframes") else {}
        finally:
            comp.Unlock()
    else:
        anim = {}
    ttype, t, i = locate_item(tl, item)
    summary = item_summary(item, ttype or "video", t, i, fps, tl.GetStartFrame())
    warnings = []
    if t != track:
        warnings.append("Title landed on V%s instead of V%s." % (t, track))
    if duration and summary["duration_frames"] != duration:
        warnings.append("Title duration is %s frames (requested %s)." % (summary["duration_frames"], duration))
    if summary["start_frame"] != start_abs - tl.GetStartFrame():
        warnings.append("Title starts at frame %s (requested %s)." % (summary["start_frame"], start_abs - tl.GetStartFrame()))
    return {
        "item": summary,
        "text_tools": [tt.GetAttrs().get("TOOLS_Name") for tt in texts],
        "inputs_set": applied,
        "keyframed": anim,
        "warnings": warnings,
    }


def t_title_update(args):
    tl = get_timeline(args.get("timeline"))
    item = find_item(tl, args["item"])
    comp = first_comp(item)
    texts = text_tools(comp)
    if args.get("tool"):
        tool = find_tool(comp, name=args["tool"])
        if tool is None:
            raise ToolError("No tool named '%s' in this comp." % args["tool"])
    elif texts:
        tool = texts[0]
    else:
        raise ToolError("No Text+ tool in this item; use fusion_set instead.")
    comp.Lock()
    try:
        applied = apply_text_style(tool, args.get("text"), args.get("style"))
        anim = animate_inputs(comp, tool, args.get("keyframes")) if args.get("keyframes") else {}
    finally:
        comp.Unlock()
    return {"tool": tool.GetAttrs().get("TOOLS_Name"), "inputs_set": applied, "keyframed": anim,
            "text_now": tool.GetInput("StyledText")}


def t_fusion_inspect(args):
    tl = get_timeline(args.get("timeline"))
    item = find_item(tl, args["item"])
    comp = first_comp(item)
    wanted = args.get("inputs")
    out = []
    for tool in comp_tools(comp):
        attrs = tool.GetAttrs() or {}
        entry = {"name": attrs.get("TOOLS_Name"), "type": attrs.get("TOOLS_RegID")}
        if args.get("list_inputs") or wanted:
            vals = {}
            for _, inp in sorted((tool.GetInputList() or {}).items()):
                ia = inp.GetAttrs() or {}
                iid = ia.get("INPS_ID")
                if wanted and iid not in wanted:
                    continue
                try:
                    vals[iid] = plain(tool.GetInput(iid))
                except Exception:
                    vals[iid] = None
            entry["inputs"] = vals
        out.append(entry)
    return {"comps": plain(item.GetFusionCompNameList()), "tools": out}


def t_fusion_set(args):
    tl = get_timeline(args.get("timeline"))
    item = find_item(tl, args["item"])
    comp = first_comp(item)
    tool = find_tool(comp, name=args.get("tool")) if args.get("tool") else (text_tools(comp) or [None])[0]
    if tool is None:
        raise ToolError("Tool not found (pass 'tool' = the Fusion node name, see fusion_inspect).")
    comp.Lock()
    try:
        for name, val in (args.get("inputs") or {}).items():
            set_tool_input(tool, name, val)
        anim = animate_inputs(comp, tool, args.get("keyframes")) if args.get("keyframes") else {}
    finally:
        comp.Unlock()
    return {"tool": tool.GetAttrs().get("TOOLS_Name"), "inputs_set": list((args.get("inputs") or {}).keys()),
            "keyframed": anim}


def _pick_codec(project, fmt, wanted):
    codecs = project.GetRenderCodecs(fmt) or {}
    names = list(codecs.values())
    if wanted in names:
        return wanted
    for desc, cname in codecs.items():
        if wanted.lower() in (desc.lower(), cname.lower()):
            return cname
    for cname in names:  # e.g. H264_NVIDIA when plain H264 is missing
        if cname.upper().startswith(wanted.upper().replace(".", "")):
            return cname
    raise ToolError("Codec '%s' not available for '%s'. Available: %s" % (wanted, fmt, codecs))


def _wait_render(project, job_id, timeout):
    deadline = time.time() + timeout
    while time.time() < deadline:
        status = project.GetRenderJobStatus(job_id) or {}
        if status.get("JobStatus") in ("Complete", "Failed", "Cancelled"):
            return status
        if not project.IsRenderingInProgress() and status.get("JobStatus") not in ("Rendering", "Ready", None):
            return status
        time.sleep(0.5)
    return dict(project.GetRenderJobStatus(job_id) or {}, timeout=True)


def t_render(args):
    r = get_resolve()
    project = get_project()
    tl = get_timeline(args.get("timeline"))
    project.SetCurrentTimeline(tl)
    out_dir = args["output_dir"]
    os.makedirs(out_dir, exist_ok=True)
    name = os.path.splitext(args.get("filename") or tl.GetName())[0]
    fmt = args.get("format", "mp4")
    codec = _pick_codec(project, fmt, args.get("codec", "H264"))
    if project.IsRenderingInProgress():
        raise ToolError("A render is already in progress.")
    r.OpenPage("deliver")
    if not project.SetCurrentRenderFormatAndCodec(fmt, codec):
        raise ToolError("Could not select %s / %s." % (fmt, codec))
    project.SetCurrentRenderMode(1)  # single clip
    settings = {
        "TargetDir": out_dir,
        "CustomName": name,
        "ExportVideo": True,
        "ExportAudio": bool(args.get("audio", True)),
        "FormatWidth": int(args.get("width") or tl.GetSetting("timelineResolutionWidth")),
        "FormatHeight": int(args.get("height") or tl.GetSetting("timelineResolutionHeight")),
    }
    start0 = tl.GetStartFrame()
    if args.get("in_frame") is not None or args.get("out_frame") is not None:
        settings["SelectAllFrames"] = False
        settings["MarkIn"] = start0 + int(args.get("in_frame", 0))
        settings["MarkOut"] = start0 + int(args.get("out_frame", tl.GetEndFrame() - start0 - 1))
    else:
        settings["SelectAllFrames"] = True
    if args.get("quality") is not None:
        settings["VideoQuality"] = args["quality"]
    if args.get("extra_settings"):
        settings.update(args["extra_settings"])
    if not project.SetRenderSettings(settings):
        raise ToolError("Resolve rejected the render settings: %s" % settings)
    job_id = project.AddRenderJob()
    if not job_id:
        raise ToolError("Could not add the render job.")
    if not project.StartRendering([job_id], isInteractiveMode=False):
        raise ToolError("Rendering did not start (job %s)." % job_id)
    result = {"job_id": job_id, "format": fmt, "codec": codec, "target_dir": out_dir, "name": name}
    if not args.get("wait", True):
        result["status"] = "started (poll with render_status)"
        return result
    status = _wait_render(project, job_id, float(args.get("timeout_seconds", 1800)))
    result["status"] = plain(status)
    files = sorted(
        (os.path.join(out_dir, f) for f in os.listdir(out_dir) if f.startswith(name)),
        key=os.path.getmtime, reverse=True,
    )
    result["output_file"] = files[0] if files else None
    if args.get("cleanup_job", True) and status.get("JobStatus") == "Complete":
        project.DeleteRenderJob(job_id)
    return result


def t_render_status(args):
    project = get_project()
    if args.get("job_id"):
        return {"job": plain(project.GetRenderJobStatus(args["job_id"])),
                "rendering": bool(project.IsRenderingInProgress())}
    return {"rendering": bool(project.IsRenderingInProgress()), "jobs": plain(project.GetRenderJobList())}


def t_exec_python(args):
    r = get_resolve()
    pm = r.GetProjectManager()
    project = pm.GetCurrentProject()
    tl = project.GetCurrentTimeline() if project else None
    ns = {
        "resolve": r,
        "dvr": _dvr_module(),
        "fusion": r.Fusion(),
        "project_manager": pm,
        "project": project,
        "media_pool": project.GetMediaPool() if project else None,
        "timeline": tl,
        "helpers": sys.modules[__name__],
        "result": None,
    }
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        exec(compile(args["code"], "<resolve_exec_python>", "exec"), ns)
    return {"stdout": buf.getvalue()[-20000:], "result": plain(ns.get("result"))}


ITEM_REF = {
    "type": "object",
    "description": "Timeline item: {\"track\": 2, \"index\": 1} (1-based, video track by default; add \"track_type\") or {\"id\": \"<unique id>\"}.",
    "properties": {
        "track": {"type": "integer"},
        "index": {"type": "integer"},
        "track_type": {"type": "string", "enum": ["video", "audio", "subtitle"]},
        "id": {"type": "string"},
    },
}
STYLE = {
    "type": "object",
    "description": "Text+ style. font (e.g. 'Open Sans'), font_style (e.g. 'Bold'), size (0.08 = default), "
                   "color ('#RRGGBB' or [r,g,b]), position [x, y] in 0..1 (0.5,0.5 = centre, origin bottom-left), "
                   "tracking, line_spacing, h_anchor (0 left / 1 centre / 2 right).",
    "properties": {
        "font": {"type": "string"}, "font_style": {"type": "string"}, "size": {"type": "number"},
        "color": {}, "position": {"type": "array", "items": {"type": "number"}},
        "tracking": {"type": "number"}, "line_spacing": {"type": "number"}, "h_anchor": {"type": "integer"},
    },
}
KEYFRAMES = {
    "type": "object",
    "description": "Animation: {InputName: {frame: value}} with frames relative to the title start. "
                   "Numbers -> Bezier spline, [x, y] -> XY path. Example: {\"Size\": {\"0\": 0, \"12\": 0.08}}.",
}

TOOLS = [
    ("resolve_status", "Connection check: Resolve edition/version, open project, timelines, render state.",
     {"type": "object", "properties": {}}, t_resolve_status),
    ("resolve_launch", "Start DaVinci Resolve if needed and wait until its scripting API answers.",
     {"type": "object", "properties": {"wait_seconds": {"type": "number"}, "headless": {"type": "boolean", "description": "Start with -nogui (no window)."}}},
     t_resolve_launch),
    ("project_open", "Open a project by name (created if missing). Optionally set timeline width/height/fps (do it before importing media).",
     {"type": "object", "required": ["name"], "properties": {
         "name": {"type": "string"}, "create_if_missing": {"type": "boolean"},
         "width": {"type": "integer"}, "height": {"type": "integer"}, "fps": {"type": "number"}}},
     t_project_open),
    ("project_save", "Save the current project.", {"type": "object", "properties": {}}, t_project_save),
    ("media_import", "Import files/folders (absolute paths) into the media pool, optionally into a named bin.",
     {"type": "object", "required": ["paths"], "properties": {
         "paths": {"type": "array", "items": {"type": "string"}}, "bin": {"type": "string"}}},
     t_media_import),
    ("media_list", "List every clip in the media pool (name, id, path, resolution, fps, frames).",
     {"type": "object", "properties": {}}, t_media_list),
    ("timeline_create", "Create (or open) a timeline, optionally filled with clips (names, ids or absolute paths; files are imported automatically). Becomes the current timeline.",
     {"type": "object", "required": ["name"], "properties": {
         "name": {"type": "string"}, "clips": {"type": "array", "items": {"type": "string"}},
         "replace": {"type": "boolean", "description": "Delete and rebuild if it already exists."}}},
     t_timeline_create),
    ("timeline_append", "Append clips to a timeline. Each clip: a name/path string or {clip, track, at_seconds|at_frame, source_start_frame, source_end_frame, media_type (1 video only, 2 audio only)}.",
     {"type": "object", "required": ["clips"], "properties": {
         "timeline": {"type": "string"}, "clips": {"type": "array", "items": {}}}},
     t_timeline_append),
    ("timeline_info", "Describe a timeline: fps, resolution, duration, every track and item (track/index/id, start, duration, Fusion comps).",
     {"type": "object", "properties": {"timeline": {"type": "string"}}}, t_timeline_info),
    ("timeline_delete_items", "Delete timeline items.",
     {"type": "object", "required": ["items"], "properties": {
         "timeline": {"type": "string"}, "items": {"type": "array", "items": ITEM_REF}, "ripple": {"type": "boolean"}}},
     t_timeline_delete_items),
    ("title_add", "Place a Fusion title (default 'Text+', or any Fusion Title template name from the Effects library) on a video track at a given time, with text, style and optional keyframe animation. The text stays editable in Resolve (Inspector or Fusion page).",
     {"type": "object", "properties": {
         "timeline": {"type": "string"}, "template": {"type": "string"}, "text": {"type": "string"},
         "start_seconds": {"type": "number"}, "start_frame": {"type": "integer"},
         "duration_seconds": {"type": "number"}, "duration_frames": {"type": "integer"},
         "track": {"type": "integer", "description": "Video track (default 2, created if missing)."},
         "style": STYLE, "inputs": {"type": "object", "description": "Raw Text+ inputs {InputID: value}."},
         "keyframes": KEYFRAMES}},
     t_title_add),
    ("title_update", "Change the text, style or animation of an existing title.",
     {"type": "object", "required": ["item"], "properties": {
         "timeline": {"type": "string"}, "item": ITEM_REF, "tool": {"type": "string"},
         "text": {"type": "string"}, "style": STYLE, "keyframes": KEYFRAMES}},
     t_title_update),
    ("fusion_inspect", "List the Fusion nodes of a timeline item, optionally with their input values (list_inputs=true or inputs=[ids]).",
     {"type": "object", "required": ["item"], "properties": {
         "timeline": {"type": "string"}, "item": ITEM_REF, "list_inputs": {"type": "boolean"},
         "inputs": {"type": "array", "items": {"type": "string"}}}},
     t_fusion_inspect),
    ("fusion_set", "Set raw inputs / keyframes on any Fusion node of a timeline item (default: first Text+ node).",
     {"type": "object", "required": ["item"], "properties": {
         "timeline": {"type": "string"}, "item": ITEM_REF, "tool": {"type": "string"},
         "inputs": {"type": "object"}, "keyframes": KEYFRAMES}},
     t_fusion_set),
    ("render", "Render the timeline to a file (default MP4 H.264, single clip, timeline resolution) and wait for completion. Returns the output file path.",
     {"type": "object", "required": ["output_dir"], "properties": {
         "timeline": {"type": "string"}, "output_dir": {"type": "string"}, "filename": {"type": "string"},
         "format": {"type": "string"}, "codec": {"type": "string"}, "width": {"type": "integer"}, "height": {"type": "integer"},
         "quality": {"description": "0 auto, bitrate int, or 'Least'..'Best'."}, "audio": {"type": "boolean"},
         "in_frame": {"type": "integer"}, "out_frame": {"type": "integer"},
         "wait": {"type": "boolean"}, "timeout_seconds": {"type": "number"},
         "extra_settings": {"type": "object", "description": "Any other SetRenderSettings key."},
         "cleanup_job": {"type": "boolean"}}},
     t_render),
    ("render_status", "Render queue / job status.",
     {"type": "object", "properties": {"job_id": {"type": "string"}}}, t_render_status),
    ("resolve_exec_python", "Escape hatch: run Python against the official Resolve API. Pre-bound: resolve, fusion, project_manager, project, media_pool, timeline, dvr, helpers. Assign `result` to return a value; print() output is returned too.",
     {"type": "object", "required": ["code"], "properties": {"code": {"type": "string"}}}, t_exec_python),
]
TOOL_MAP = {name: fn for name, _, _, fn in TOOLS}

# --------------------------------------------------------------------------- #
# MCP stdio protocol (JSON-RPC 2.0, newline-delimited)
# --------------------------------------------------------------------------- #
SUPPORTED_PROTOCOLS = ("2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05")


def send(msg):
    _PROTO_OUT.write((json.dumps(msg, ensure_ascii=False) + "\n").encode("utf-8"))
    _PROTO_OUT.flush()


def handle(msg):
    method = msg.get("method")
    mid = msg.get("id")
    params = msg.get("params") or {}
    if mid is None:  # notification (initialized, cancelled, ...)
        return
    if method == "initialize":
        requested = params.get("protocolVersion")
        send({"jsonrpc": "2.0", "id": mid, "result": {
            "protocolVersion": requested if requested in SUPPORTED_PROTOCOLS else SUPPORTED_PROTOCOLS[1],
            "capabilities": {"tools": {"listChanged": False}},
            "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
            "instructions": "Drives DaVinci Resolve Studio through Blackmagic's official scripting API. "
                            "Typical flow: resolve_launch -> project_open -> timeline_create -> title_add -> render. "
                            "Times are timeline-relative (seconds or frames from the timeline start).",
        }})
    elif method == "ping":
        send({"jsonrpc": "2.0", "id": mid, "result": {}})
    elif method == "tools/list":
        send({"jsonrpc": "2.0", "id": mid, "result": {"tools": [
            {"name": n, "description": d, "inputSchema": s} for n, d, s, _ in TOOLS]}})
    elif method == "tools/call":
        name = params.get("name")
        fn = TOOL_MAP.get(name)
        if fn is None:
            send({"jsonrpc": "2.0", "id": mid, "error": {"code": -32602, "message": "Unknown tool: %s" % name}})
            return
        try:
            data = fn(params.get("arguments") or {})
            text = json.dumps(plain(data), ensure_ascii=False, indent=1)
            send({"jsonrpc": "2.0", "id": mid, "result": {"content": [{"type": "text", "text": text}], "isError": False}})
        except ToolError as exc:
            send({"jsonrpc": "2.0", "id": mid, "result": {"content": [{"type": "text", "text": str(exc)}], "isError": True}})
        except Exception:
            send({"jsonrpc": "2.0", "id": mid, "result": {
                "content": [{"type": "text", "text": traceback.format_exc()[-4000:]}], "isError": True}})
    elif method in ("resources/list", "prompts/list"):
        key = method.split("/")[0]
        send({"jsonrpc": "2.0", "id": mid, "result": {key: []}})
    else:
        send({"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": "Method not found: %s" % method}})


def main():
    for raw in iter(sys.stdin.buffer.readline, b""):
        line = raw.strip()
        if not line:
            continue
        try:
            msg = json.loads(line.decode("utf-8"))
        except ValueError:
            send({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}})
            continue
        batch = msg if isinstance(msg, list) else [msg]
        for m in batch:
            try:
                handle(m)
            except Exception:
                traceback.print_exc(file=sys.stderr)


if __name__ == "__main__":
    main()
