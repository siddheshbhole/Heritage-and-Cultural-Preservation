"""Launch uvicorn on port 8000 listening on BOTH IPv4 (127.0.0.1) and IPv6
(::1) loopback, so ``http://localhost:8000`` works no matter how the OS
resolves ``localhost``.

Run from the ``backend/`` directory::

    .venv\\Scripts\\python.exe run_server.py
"""

import socket
import sys

import uvicorn

HOST = "::"
PORT = 8000

def _is_port_in_use_error(err: Exception) -> bool:
    win_err = getattr(err, "winerror", None)
    err_no = getattr(err, "errno", None)
    msg = str(err).lower()
    return win_err == 10048 or err_no in (98, 10048) or "already in use" in msg or "only one usage" in msg

sock = None
try:
    sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
    sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((HOST, PORT))
    sock.listen(2048)
except Exception as err:
    if _is_port_in_use_error(err):
        print(f"Error: Port {PORT} is already in use by another process. Please stop the service on port {PORT} and try again.")
        sys.exit(1)
    print(f"Warning: Dual-stack IPv6 socket bind failed ({err}). Falling back to IPv4 socket on 0.0.0.0:{PORT}...")
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(("0.0.0.0", PORT))
        sock.listen(2048)
    except Exception as ipv4_err:
        if _is_port_in_use_error(ipv4_err):
            print(f"Error: Port {PORT} is already in use by another process. Please stop the service on port {PORT} and try again.")
        else:
            print(f"Error: Could not bind IPv4 socket on port {PORT}: {ipv4_err}")
        sys.exit(1)

config = uvicorn.Config("app.main:app", workers=1)
server = uvicorn.Server(config)
server.run(sockets=[sock])
