# Evertz Quartz Protocol Specification

## 1. Overview

The Evertz Quartz Protocol is a simple ASCII-based communication protocol designed for controlling video matrix 
switchers and routing equipment. It operates over TCP/IP connections and provides commands for video routing, 
device status inquiry, and preset execution.

## Connection Parameters

- **Protocol**: TCP/IP
- **Default Port**: 6543, or other. User specified
- **Character Encoding**: ASCII
- **Command Termination**: `\r\n` (Carriage Return + Line Feed)
- **Response Format**: ASCII text terminated with `\r\n`
- **Connection Mode**: Request-Response (one command per connection)
- **Timeout**: 1-5 seconds recommended

## 2. Command Structure

All commands follow this general format:
```
.<COMMAND><PARAMETERS>\r\n
```

- Commands always start with a dot (`.`)
- Commands are case-sensitive
- Parameters are separated by commas where applicable
- No spaces between command elements

## 3. Command Reference

### 3.1 Read Input Name
**Command**: `.RD<INPUT_NUMBER>`

**Description**: Retrieves the configured name/label of a specified input.

**Parameters**:
- `<INPUT_NUMBER>`: Input number (integer, 1-based)

**Example**:
```
Request:  .RD1
Response: .RAD1,Camera 1
```

**Response Format**: `.RAD<INPUT_NUMBER>,<INPUT_NAME>`

### 3.2 Read Output Name
**Command**: `.RS<OUTPUT_NUMBER>`

**Description**: Retrieves the configured name/label of a specified output.

**Parameters**:
- `<OUTPUT_NUMBER>`: Output number (integer, 1-based)

**Example**:
```
Request:  .RS1  
Response: .RAS1,Aux out 1
```

**Response Format**: `.RAS<OUTPUT_NUMBER>,<OUTPUT_NAME>`


### 3.3 Read Current Routing
**Command**: `.I<LEVEL><OUTPUT_NUMBER>`
**Description**: Retrieves the current input routed to specific output.
**Parameters**:
- `<LEVEL>`: Level of routing (default is `V`, video)
- `<OUTPUT_NUMBER>`: Output number (integer)
- **Example**:
```
Request:  .IV1
Response: .AV1,179
```
`.AV<OUTPUT_NUMBER>,<INPUT_NUMBER>`


**Response Format**: `.AV<OUTPUT_NUMBER>,<INPUT_NUMBER>`
**Description**: Indicates that to output 1 is currently routed input 179. 
**Note**: The level can be `V` only. Other levels in this case not used.

### 3.4 Video Routing Commands

#### Switch Video Input to Output
**Command**: `.SV<OUTPUT>,<INPUT>`

**Description**: Routes a specified video input to a specified output.

**Parameters**:
- `<OUTPUT>`: Output number (integer, 1-based)
- `<INPUT>`: Input number (integer, 1-based)

**Example**:
```
.SV1,7
```
Routes video input 7 to output 1.

**Response**: Success acknowledged by connection close, error returns `.E`

### Error Handling

#### Error Response
**Response**: `.E`

**Description**: Returned when a command cannot be executed due to:
- Invalid command syntax
- Out-of-range parameters
- Hardware/system error
- Resource unavailable


#### Standard Router Responses
**Code Meaning**
.A Acknowledge — command accepted / reply data follows

.E Error — bad command or invalid parameters

.B Barred — action refused (output is locked)

.U{levels}{dest},{src} Update — a cross-point changed

## Implementation Guidelines

### Connection Management

1. **Establish Connection**: Create TCP socket connection to device IP and port 6543
2. **Send Command**: Transmit ASCII command terminated with `\r\n`
3. **Receive Response**: Read response data (if applicable)
4. **Close Connection**: Properly close socket after each command

#### команди для використання в додатку:
- `.RD{n}` - отримання імені входу n
- `.RS{n}` - отримання імені виходу n
- `.SV{output},{input}` - виконання перемикання