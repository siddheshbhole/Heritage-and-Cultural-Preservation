"""Launch uvicorn on port 8000 listening on BOTH IPv4 (127.0.0.1) and IPv6
(::1) loopback, so ``http://localhost:8000`` works no matter how the OS
resolves ``localhost``.

Run from the ``backend/`` directory::

    .venv\\Scripts\\python.exe run_server.py
"""

import socket

import uvicorn

HOST = "::"
PORT = 8000

sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind((HOST, PORT))
sock.listen(2048)

config = uvicorn.Config("app.main:app", workers=1)
server = uvicorn.Server(config)
server.run(sockets=[sock])