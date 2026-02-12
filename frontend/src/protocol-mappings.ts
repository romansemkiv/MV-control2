/**
 * NEXX Protocol Mappings
 * Централізовані мапінги між NEXX API enum індексами та реальними значеннями
 */

// ============================================================================
// NEXX API VarIDs
// ============================================================================

// System Info (Read-only)
export const VARID_TOTAL_MVS = '2700'
export const VARID_LICENSED_MVS = '2701'
export const VARID_ENABLED_MVS = '2702'

// Multiviewer Level [mv_index]
export const VARID_MV_ENABLE = '2703'
export const VARID_MV_LAYOUT = '2704'
export const VARID_MV_FONT = '2716'
export const VARID_MV_OUTPUT_FORMAT = '2720'
export const VARID_MV_OUTER_BORDER = '2726'
export const VARID_MV_INNER_BORDER = '2727'
export const VARID_MV_UPDATE_PREVIEW = '2735'

// Window Level [mv_index].[window_index]
export const VARID_VIDEO_AUDIO_SOURCE = '2707'
export const VARID_SOURCE_LABEL = '2718'
export const VARID_PCM_BARS = '2719'

// UMD Level [mv_index].[window_index].[layer_index]
export const VARID_UMD_SELECTION = '2708'
export const VARID_UMD_TEXT = '2709'
export const VARID_UMD_BOX_COLOUR = '2710'
export const VARID_UMD_BOX_ALPHA = '2711'
export const VARID_UMD_BOX_X = '2712'
export const VARID_UMD_BOX_Y = '2713'
export const VARID_UMD_TEXT_COLOUR = '2714'
export const VARID_UMD_TEXT_ALPHA = '2715'
export const VARID_UMD_TEXT_SIZE = '2717'
export const VARID_UMD_PADDING = '2733'

// Global Settings
export const VARID_WINDOW_SIZE = '2721'
export const VARID_TIMECODE_SOURCE = '2722'
export const VARID_TIMECODE_FORMAT = '2734'
export const VARID_NTP_OFFSET_DIRECTION = '2723'
export const VARID_NTP_OFFSET_HOURS = '2724'
export const VARID_NTP_OFFSET_MINUTES = '2725'
export const VARID_GLOBAL_ATC_1_SOURCE = '2729'
export const VARID_GLOBAL_ATC_2_SOURCE = '2730'
export const VARID_GLOBAL_ATC_3_SOURCE = '2731'
export const VARID_GLOBAL_ATC_4_SOURCE = '2732'

export const UMD_VARIDS = [
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

// ============================================================================
// PCM Audio Bars (VarID 2719)
// ============================================================================

export const PCM_BARS_VALUES = [0, 2, 4, 6, 8, 12, 16] as const
export type PcmBarsValue = (typeof PCM_BARS_VALUES)[number]

export const PCM_BARS_LABELS: Record<PcmBarsValue, string> = {
  0: 'Off',
  2: '2 bars',
  4: '4 bars',
  6: '6 bars',
  8: '8 bars',
  12: '12 bars',
  16: '16 bars',
}

// ============================================================================
// UMD Selection (VarID 2708)
// ============================================================================

export const UmdSelection = {
  Off: 0,
  Static: 1,
  DynamicLine1: 3,
  NtpTime: 7,
  NtpTimeOffset: 8,
} as const

export type UmdSelection = (typeof UmdSelection)[keyof typeof UmdSelection]

export const UMD_SELECTION_LABELS: Record<UmdSelection, string> = {
  [UmdSelection.Off]: 'Off',
  [UmdSelection.Static]: 'Static',
  [UmdSelection.DynamicLine1]: 'Dynamic Line 1',
  [UmdSelection.NtpTime]: 'NTP Time',
  [UmdSelection.NtpTimeOffset]: 'NTP Time with Offset',
}

// ============================================================================
// UMD Box Colour (VarID 2710)
// ============================================================================

export const UMD_BOX_COLOUR_LABELS: Record<number, string> = {
  0: 'Black',
  1: 'Blue',
  2: 'Green',
  3: 'Cyan',
  4: 'Red',
  5: 'Magenta',
  6: 'Yellow',
  7: 'White',
}

// ============================================================================
// UMD Text Colour (VarID 2714)
// ============================================================================

export const UMD_TEXT_COLOUR_LABELS: Record<number, string> = {
  0: 'Blue',
  1: 'Green',
  2: 'Cyan',
  3: 'Red',
  4: 'Magenta',
  5: 'Yellow',
  6: 'White',
  7: 'Black',
}

// ============================================================================
// UMD Box Alpha (VarID 2711)
// ============================================================================

export const UMD_BOX_ALPHA_LABELS: Record<number, string> = {
  0: '0%',
  1: '25%',
  2: '50%',
  3: '75%',
  4: '100%',
}

// ============================================================================
// UMD Text Size (VarID 2717)
// ============================================================================

export const UMD_TEXT_SIZE_LABELS: Record<number, string> = {
  0: 'Small',
  1: 'Medium',
  2: 'Large',
  3: 'X-Large',
}

// ============================================================================
// UMD Padding (VarID 2733)
// ============================================================================

export const UMD_PADDING_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Small',
  2: 'Medium',
  3: 'Large',
}

// ============================================================================
// Window Size (VarID 2721)
// ============================================================================

export const WindowSize = {
  Full: 0,
  ReducedSmall: 1,
  ReducedMedium: 2,
  ReducedLarge: 3,
} as const

export type WindowSize = (typeof WindowSize)[keyof typeof WindowSize]

export const WINDOW_SIZE_LABELS: Record<WindowSize, string> = {
  [WindowSize.Full]: 'Full',
  [WindowSize.ReducedSmall]: 'Reduced Small',
  [WindowSize.ReducedMedium]: 'Reduced Medium',
  [WindowSize.ReducedLarge]: 'Reduced Large',
}

// ============================================================================
// Timecode Source (VarID 2722)
// ============================================================================

export const TimecodeSource = {
  LocalATC: 0,
  NTP: 1,
  NTPOffset: 2,
  GlobalATC1: 3,
  GlobalATC2: 4,
  GlobalATC3: 5,
  GlobalATC4: 6,
} as const

export type TimecodeSource = (typeof TimecodeSource)[keyof typeof TimecodeSource]

export const TIMECODE_SOURCE_LABELS: Record<TimecodeSource, string> = {
  [TimecodeSource.LocalATC]: 'Local ATC',
  [TimecodeSource.NTP]: 'NTP',
  [TimecodeSource.NTPOffset]: 'NTP with Offset',
  [TimecodeSource.GlobalATC1]: 'Global ATC 1',
  [TimecodeSource.GlobalATC2]: 'Global ATC 2',
  [TimecodeSource.GlobalATC3]: 'Global ATC 3',
  [TimecodeSource.GlobalATC4]: 'Global ATC 4',
}

// ============================================================================
// Timecode Format (VarID 2734)
// ============================================================================

export const TimecodeFormat = {
  Full: 0,
  Short: 1,
} as const

export type TimecodeFormat = (typeof TimecodeFormat)[keyof typeof TimecodeFormat]

export const TIMECODE_FORMAT_LABELS: Record<TimecodeFormat, string> = {
  [TimecodeFormat.Full]: 'HH:MM:SS:FF.F',
  [TimecodeFormat.Short]: 'HH:MM:SS',
}

// ============================================================================
// NTP Offset Direction (VarID 2723)
// ============================================================================

export const NtpOffsetDirection = {
  Plus: 0,
  Minus: 1,
} as const

export type NtpOffsetDirection = (typeof NtpOffsetDirection)[keyof typeof NtpOffsetDirection]

export const NTP_OFFSET_DIRECTION_LABELS: Record<NtpOffsetDirection, string> = {
  [NtpOffsetDirection.Plus]: '+',
  [NtpOffsetDirection.Minus]: '-',
}

// ============================================================================
// MV Enable (VarID 2703)
// ============================================================================

export const MvEnable = {
  Disabled: 0,
  Enabled: 1,
} as const

export type MvEnable = (typeof MvEnable)[keyof typeof MvEnable]

export const MV_ENABLE_LABELS: Record<MvEnable, string> = {
  [MvEnable.Disabled]: 'Disabled',
  [MvEnable.Enabled]: 'Enabled',
}

// ============================================================================
// Output Format (VarID 2720)
// ============================================================================

export const OutputFormat = {
  _1080p59: 0,
  _1080p50: 1,
  _1080i59: 2,
  _1080i50: 3,
} as const

export type OutputFormat = (typeof OutputFormat)[keyof typeof OutputFormat]

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  [OutputFormat._1080p59]: '1080p59',
  [OutputFormat._1080p50]: '1080p50',
  [OutputFormat._1080i59]: '1080i59',
  [OutputFormat._1080i50]: '1080i50',
}

// ============================================================================
// Text Font (VarID 2716)
// ============================================================================

export const TextFont = {
  Sans: 0,
  SansMono: 1,
  DDin: 2,
} as const

export type TextFont = (typeof TextFont)[keyof typeof TextFont]

export const TEXT_FONT_LABELS: Record<TextFont, string> = {
  [TextFont.Sans]: 'Sans',
  [TextFont.SansMono]: 'Sans Mono',
  [TextFont.DDin]: 'D Din',
}

// ============================================================================
// Border Pixels (VarID 2726 outer / 2727 inner)
// ============================================================================

export const BORDER_PIXEL_VALUES = [0, 1, 2, 3, 4] as const
export type BorderPixelValue = (typeof BORDER_PIXEL_VALUES)[number]

export const BORDER_PIXEL_LABELS: Record<BorderPixelValue, string> = {
  0: '0 px',
  1: '1 px',
  2: '2 px',
  3: '3 px',
  4: '4 px',
}

// ============================================================================
// System Limits
// ============================================================================

export const MAX_MULTIVIEWERS = 120
export const MAX_WINDOWS_PER_MV = 16
export const MAX_UMD_LAYERS = 3
export const MAX_SDI_INPUTS = 960
export const MAX_LAYOUTS = 43
export const MAX_BATCH_PARAMS = 40
