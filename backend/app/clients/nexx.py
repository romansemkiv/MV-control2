from urllib.parse import quote
import logging

import httpx

logger = logging.getLogger(__name__)


class NEXXError(Exception):
    pass


class NEXXClient:
    def __init__(self, host: str, api_key: str | None = None, jwt: str | None = None):
        host = host.rstrip('/')
        if host.startswith('http://'):
            host = host[7:]
        elif host.startswith('https://'):
            host = host[8:]
        self.base_url = f"http://{host}/v.api/apis"
        self.api_key = api_key
        self.jwt = jwt
        self._client = httpx.Client(timeout=10, verify=False, follow_redirects=False)
        logger.info(f"[NEXX] Initialized with base_url: {self.base_url}")

    def _headers(self) -> dict:
        headers = {}
        if self.api_key:
            headers["webeasy-api-key"] = self.api_key
        elif self.jwt:
            headers["jwt"] = self.jwt
        return headers

    def get_parameter(self, varid: str) -> str | int:
        url = f"{self.base_url}/EV/GET/parameter/{varid}"
        logger.debug(f"[NEXX] GET {url}")
        try:
            r = self._client.get(url, headers=self._headers())
            r.raise_for_status()
            data = r.json()
            logger.debug(f"[NEXX] Response: {data}")
            if isinstance(data, dict) and "error" in data:
                raise NEXXError(data["error"])
            # Handle different response formats from quartz_dump.py
            if isinstance(data, dict):
                if "value" in data:
                    # Format: {"id": "2700@...", "value": 120}
                    return data["value"]
                elif varid in data:
                    # Format: {"2700": 120}
                    return data[varid]
            # Fallback
            return str(data) if data is not None else ""
        except httpx.HTTPStatusError as e:
            raise NEXXError(f"HTTP {e.response.status_code}: {e.response.text[:200]}")
        except Exception as e:
            raise NEXXError(f"Request failed: {str(e)}")

    def get_parameters(self, varids: list[str]) -> dict[str, str | int]:
        joined = ",".join(varids)
        url = f"{self.base_url}/EV/GET/parameters/{joined}"
        logger.debug(f"[NEXX] GET {url}")
        try:
            r = self._client.get(url, headers=self._headers())
            r.raise_for_status()
            data = r.json()
            logger.debug(f"[NEXX] Response: {data}")
            if isinstance(data, dict) and "error" in data:
                raise NEXXError(data["error"])
            # Parse response: could be list or dict (from quartz_dump.py)
            if isinstance(data, list):
                result = {}
                for item in data:
                    if isinstance(item, dict):
                        varid = item.get("id", "").split("@")[0] if "@" in item.get("id", "") else item.get("id", "")
                        # Keep original type (int or str)
                        result[varid] = item.get("value")
                return result
            elif isinstance(data, dict):
                # Direct dict format: {"2700": 120, "2701": 100}
                return data
            return {}
        except httpx.HTTPStatusError as e:
            raise NEXXError(f"HTTP {e.response.status_code}: {e.response.text[:200]}")
        except Exception as e:
            raise NEXXError(f"Request failed: {str(e)}")

    def set_parameter(self, varid: str, value: str) -> dict:
        encoded_value = quote(str(value), safe="")
        url = f"{self.base_url}/EV/SET/parameter/{varid}/{encoded_value}"
        logger.info(f"[NEXX] SET {varid} = {value}")
        try:
            r = self._client.get(url, headers=self._headers())
            r.raise_for_status()
            data = r.json()
            logger.debug(f"[NEXX] Response: {data}")
            return data
        except httpx.HTTPStatusError as e:
            raise NEXXError(f"HTTP {e.response.status_code}: {e.response.text[:200]}")
        except Exception as e:
            raise NEXXError(f"Request failed: {str(e)}")

    def set_parameters(self, varids: list[str], values: list[str]) -> dict:
        joined_ids = ",".join(varids)
        joined_vals = ",".join(quote(str(v), safe="") for v in values)
        url = f"{self.base_url}/EV/SET/parameters/{joined_ids}/{joined_vals}"
        logger.info(f"[NEXX] SET batch: {len(varids)} parameters")
        try:
            r = self._client.get(url, headers=self._headers())
            r.raise_for_status()
            data = r.json()
            logger.debug(f"[NEXX] Response: {data}")
            return data
        except httpx.HTTPStatusError as e:
            raise NEXXError(f"HTTP {e.response.status_code}: {e.response.text[:200]}")
        except Exception as e:
            raise NEXXError(f"Request failed: {str(e)}")

    def jwt_create(self, username: str, password: str) -> str:
        import base64, json
        creds = json.dumps({"username": username, "password": password})
        b64 = base64.b64encode(creds.encode()).decode()
        r = self._client.get(f"{self.base_url}/BT/JWTCREATE/{b64}")
        data = r.json()
        if data.get("status") != "success":
            raise NEXXError(f"JWT creation failed: {data}")
        self.jwt = data["jwt"]
        return data["jwt"]

    def jwt_refresh(self) -> str:
        if not self.jwt:
            raise NEXXError("No JWT to refresh")
        r = self._client.get(f"{self.base_url}/BT/JWTREFRESH/{self.jwt}")
        data = r.json()
        if data.get("status") != "success":
            raise NEXXError(f"JWT refresh failed: {data}")
        self.jwt = data["jwt"]
        return data["jwt"]
