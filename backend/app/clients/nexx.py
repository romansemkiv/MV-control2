from urllib.parse import quote

import httpx


class NEXXError(Exception):
    pass


class NEXXClient:
    def __init__(self, host: str, api_key: str | None = None, jwt: str | None = None):
        self.base_url = f"http://{host}/v.api/apis"
        self.api_key = api_key
        self.jwt = jwt

    def _headers(self) -> dict:
        headers = {}
        if self.api_key:
            headers["webeasy-api-key"] = self.api_key
        elif self.jwt:
            headers["jwt"] = self.jwt
        return headers

    def get_parameter(self, varid: str) -> str:
        r = httpx.get(f"{self.base_url}/EV/GET/parameter/{varid}", headers=self._headers(), timeout=10)
        data = r.json()
        if "error" in data:
            raise NEXXError(data["error"])
        return data.get(varid, "")

    def get_parameters(self, varids: list[str]) -> dict[str, str]:
        joined = ",".join(varids)
        r = httpx.get(f"{self.base_url}/EV/GET/parameters/{joined}", headers=self._headers(), timeout=10)
        data = r.json()
        if "error" in data:
            raise NEXXError(data["error"])
        return data

    def set_parameter(self, varid: str, value: str) -> dict:
        encoded_value = quote(str(value), safe="")
        r = httpx.get(f"{self.base_url}/EV/SET/parameter/{varid}/{encoded_value}", headers=self._headers(), timeout=10)
        return r.json()

    def set_parameters(self, varids: list[str], values: list[str]) -> dict:
        joined_ids = ",".join(varids)
        joined_vals = ",".join(quote(str(v), safe="") for v in values)
        r = httpx.get(f"{self.base_url}/EV/SET/parameters/{joined_ids}/{joined_vals}", headers=self._headers(), timeout=10)
        return r.json()

    def jwt_create(self, username: str, password: str) -> str:
        import base64, json
        creds = json.dumps({"username": username, "password": password})
        b64 = base64.b64encode(creds.encode()).decode()
        r = httpx.get(f"{self.base_url}/BT/JWTCREATE/{b64}", timeout=10)
        data = r.json()
        if data.get("status") != "success":
            raise NEXXError(f"JWT creation failed: {data}")
        self.jwt = data["jwt"]
        return data["jwt"]

    def jwt_refresh(self) -> str:
        if not self.jwt:
            raise NEXXError("No JWT to refresh")
        r = httpx.get(f"{self.base_url}/BT/JWTREFRESH/{self.jwt}", timeout=10)
        data = r.json()
        if data.get("status") != "success":
            raise NEXXError(f"JWT refresh failed: {data}")
        self.jwt = data["jwt"]
        return data["jwt"]
