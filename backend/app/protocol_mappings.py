"""
NEXX Protocol Mappings
Централізовані мапінги між NEXX API enum індексами та реальними значеннями
"""

# ============================================================================
# NEXX API VarIDs
# ============================================================================

# System Info (Read-only)
VARID_TOTAL_MVS = "2700"
VARID_LICENSED_MVS = "2701"
VARID_ENABLED_MVS = "2702"

# Multiviewer Level [mv_index]
VARID_MV_ENABLE = "2703"
VARID_MV_LAYOUT = "2704"
VARID_MV_FONT = "2716"
VARID_MV_OUTPUT_FORMAT = "2720"
VARID_MV_OUTER_BORDER = "2726"
VARID_MV_INNER_BORDER = "2727"
VARID_MV_UPDATE_PREVIEW = "2735"

# Window Level [mv_index].[window_index]
VARID_VIDEO_AUDIO_SOURCE = "2707"
VARID_SOURCE_LABEL = "2718"
VARID_PCM_BARS = "2719"

# UMD Level [mv_index].[window_index].[layer_index]
VARID_UMD_SELECTION = "2708"
VARID_UMD_TEXT = "2709"
VARID_UMD_BOX_COLOUR = "2710"
VARID_UMD_BOX_ALPHA = "2711"
VARID_UMD_BOX_X = "2712"
VARID_UMD_BOX_Y = "2713"
VARID_UMD_TEXT_COLOUR = "2714"
VARID_UMD_TEXT_ALPHA = "2715"
VARID_UMD_TEXT_SIZE = "2717"
VARID_UMD_PADDING = "2733"

# Global Settings
VARID_WINDOW_SIZE = "2721"
VARID_TIMECODE_SOURCE = "2722"
VARID_TIMECODE_FORMAT = "2734"
VARID_NTP_OFFSET_DIRECTION = "2723"
VARID_NTP_OFFSET_HOURS = "2724"
VARID_NTP_OFFSET_MINUTES = "2725"
VARID_GLOBAL_ATC_1_SOURCE = "2729"
VARID_GLOBAL_ATC_2_SOURCE = "2730"
VARID_GLOBAL_ATC_3_SOURCE = "2731"
VARID_GLOBAL_ATC_4_SOURCE = "2732"

UMD_VARIDS = [
    VARID_UMD_SELECTION,
    VARID_UMD_TEXT,
    VARID_UMD_BOX_COLOUR,
    VARID_UMD_BOX_ALPHA,
    VARID_UMD_BOX_X,
    VARID_UMD_BOX_Y,
    VARID_UMD_TEXT_COLOUR,
    VARID_UMD_TEXT_ALPHA,
    VARID_UMD_TEXT_SIZE,
    VARID_UMD_PADDING,
]


# ============================================================================
# PCM Audio Bars (VarID 2719)
# ============================================================================

PCM_BARS_VALUES = [0, 2, 4, 6, 8, 12, 16]
PCM_BARS_TO_INDEX = {0: 0, 2: 1, 4: 2, 6: 3, 8: 4, 12: 5, 16: 6}


def pcm_index_to_value(index: int) -> int:
    """Конвертує NEXX API індекс в GUI значення для PCM Audio Bars"""
    if 0 <= index < len(PCM_BARS_VALUES):
        return PCM_BARS_VALUES[index]
    return 0


def pcm_value_to_index(value: int) -> int:
    """Конвертує GUI значення в NEXX API індекс для PCM Audio Bars"""
    return PCM_BARS_TO_INDEX.get(value, 0)


# ============================================================================
# UMD Selection (VarID 2708)
# ============================================================================

UMD_SELECTION_OFF = 0
UMD_SELECTION_STATIC = 1
UMD_SELECTION_DYNAMIC_LINE_1 = 2
UMD_SELECTION_NTP_TIME = 3
UMD_SELECTION_NTP_TIME_OFFSET = 4

UMD_SELECTION_LABELS = {
    UMD_SELECTION_OFF: "Off",
    UMD_SELECTION_STATIC: "Static",
    UMD_SELECTION_DYNAMIC_LINE_1: "Dynamic Line 1",
    UMD_SELECTION_NTP_TIME: "NTP Time",
    UMD_SELECTION_NTP_TIME_OFFSET: "NTP Time with Offset",
}


# ============================================================================
# Window Size (VarID 2721)
# ============================================================================

WINDOW_SIZE_FULL = 0
WINDOW_SIZE_REDUCED_SMALL = 1
WINDOW_SIZE_REDUCED_MEDIUM = 2
WINDOW_SIZE_REDUCED_LARGE = 3

WINDOW_SIZE_LABELS = {
    WINDOW_SIZE_FULL: "Full",
    WINDOW_SIZE_REDUCED_SMALL: "Reduced Small",
    WINDOW_SIZE_REDUCED_MEDIUM: "Reduced Medium",
    WINDOW_SIZE_REDUCED_LARGE: "Reduced Large",
}


# ============================================================================
# Timecode Source (VarID 2722)
# ============================================================================

TIMECODE_SOURCE_LOCAL_ATC = 0
TIMECODE_SOURCE_NTP = 1
TIMECODE_SOURCE_NTP_OFFSET = 2
TIMECODE_SOURCE_GLOBAL_ATC_1 = 3
TIMECODE_SOURCE_GLOBAL_ATC_2 = 4
TIMECODE_SOURCE_GLOBAL_ATC_3 = 5
TIMECODE_SOURCE_GLOBAL_ATC_4 = 6

TIMECODE_SOURCE_LABELS = {
    TIMECODE_SOURCE_LOCAL_ATC: "Local ATC",
    TIMECODE_SOURCE_NTP: "NTP",
    TIMECODE_SOURCE_NTP_OFFSET: "NTP with Offset",
    TIMECODE_SOURCE_GLOBAL_ATC_1: "Global ATC 1",
    TIMECODE_SOURCE_GLOBAL_ATC_2: "Global ATC 2",
    TIMECODE_SOURCE_GLOBAL_ATC_3: "Global ATC 3",
    TIMECODE_SOURCE_GLOBAL_ATC_4: "Global ATC 4",
}


# ============================================================================
# Timecode Format (VarID 2734)
# ============================================================================

TIMECODE_FORMAT_FULL = 0
TIMECODE_FORMAT_SHORT = 1

TIMECODE_FORMAT_LABELS = {
    TIMECODE_FORMAT_FULL: "HH:MM:SS:FF.F",
    TIMECODE_FORMAT_SHORT: "HH:MM:SS",
}


# ============================================================================
# NTP Offset Direction (VarID 2723)
# ============================================================================

NTP_OFFSET_DIRECTION_PLUS = 0
NTP_OFFSET_DIRECTION_MINUS = 1

NTP_OFFSET_DIRECTION_LABELS = {
    NTP_OFFSET_DIRECTION_PLUS: "+",
    NTP_OFFSET_DIRECTION_MINUS: "-",
}


# ============================================================================
# MV Enable (VarID 2703)
# ============================================================================

MV_ENABLE_DISABLED = 0
MV_ENABLE_ENABLED = 1

MV_ENABLE_LABELS = {
    MV_ENABLE_DISABLED: "Disabled",
    MV_ENABLE_ENABLED: "Enabled",
}


# ============================================================================
# Output Format (VarID 2720)
# ============================================================================

OUTPUT_FORMAT_1080P59 = 0
OUTPUT_FORMAT_1080P50 = 1
OUTPUT_FORMAT_1080I59 = 2
OUTPUT_FORMAT_1080I50 = 3

OUTPUT_FORMAT_LABELS = {
    OUTPUT_FORMAT_1080P59: "1080p59",
    OUTPUT_FORMAT_1080P50: "1080p50",
    OUTPUT_FORMAT_1080I59: "1080i59",
    OUTPUT_FORMAT_1080I50: "1080i50",
}


# ============================================================================
# Text Font (VarID 2716)
# ============================================================================

TEXT_FONT_SANS = 0
TEXT_FONT_SANS_MONO = 1
TEXT_FONT_D_DIN = 2

TEXT_FONT_LABELS = {
    TEXT_FONT_SANS: "Sans",
    TEXT_FONT_SANS_MONO: "Sans Mono",
    TEXT_FONT_D_DIN: "D Din",
}


# ============================================================================
# Border Pixels (VarID 2726 outer / 2727 inner)
# ============================================================================

BORDER_PIXEL_VALUES = [0, 1, 2, 3, 4]

BORDER_PIXEL_LABELS = {
    0: "0 px",
    1: "1 px",
    2: "2 px",
    3: "3 px",
    4: "4 px",
}


# ============================================================================
# System Limits
# ============================================================================

MAX_MULTIVIEWERS = 120
MAX_WINDOWS_PER_MV = 16
MAX_UMD_LAYERS = 3
MAX_SDI_INPUTS = 960
MAX_LAYOUTS = 43
MAX_BATCH_PARAMS = 40
