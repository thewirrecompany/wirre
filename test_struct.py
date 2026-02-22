import struct
import time
fmt = "<IBQII"
timestamp = time.time()
ip_int = 12345
payload_bytes = b"hello"
try:
    header = struct.pack(fmt, 0xDEADBEEF, 0x01, int(timestamp * 1000000), ip_int, len(payload_bytes))
    print("Success")
except Exception as e:
    print(e)
