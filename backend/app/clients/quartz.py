import socket


class QuartzError(Exception):
    pass


class QuartzClient:
    def __init__(self, host: str, port: int = 6543, timeout: float = 3.0):
        self.host = host
        self.port = port
        self.timeout = timeout

    def _send(self, command: str) -> str:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(self.timeout)
            sock.connect((self.host, self.port))
            sock.sendall(f"{command}\r\n".encode("ascii"))
            data = b""
            while True:
                try:
                    chunk = sock.recv(1024)
                    if not chunk:
                        break
                    data += chunk
                    if b"\r\n" in data:
                        break
                except socket.timeout:
                    break
        return data.decode("ascii").strip()

    def read_input_name(self, input_number: int) -> str:
        response = self._send(f".RD{input_number}")
        if response.startswith(".E"):
            raise QuartzError(f"Error reading input {input_number}")
        # .RAD{n},{name}
        parts = response.split(",", 1)
        return parts[1] if len(parts) > 1 else ""

    def read_output_name(self, output_number: int) -> str:
        response = self._send(f".RS{output_number}")
        if response.startswith(".E"):
            raise QuartzError(f"Error reading output {output_number}")
        # .RAS{n},{name}
        parts = response.split(",", 1)
        return parts[1] if len(parts) > 1 else ""

    def read_routing(self, output_number: int) -> int:
        response = self._send(f".IV{output_number}")
        if response.startswith(".E"):
            raise QuartzError(f"Error reading routing for output {output_number}")
        # .AV{output},{input}
        parts = response.split(",", 1)
        return int(parts[1]) if len(parts) > 1 else -1

    def switch(self, output: int, input_number: int) -> bool:
        response = self._send(f".SV{output},{input_number}")
        if response.startswith(".E"):
            raise QuartzError(f"Switch failed: output={output}, input={input_number}")
        if response.startswith(".B"):
            raise QuartzError(f"Output {output} is locked")
        return True
