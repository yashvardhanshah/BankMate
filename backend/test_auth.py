from app.auth import hash_password, verify_password

hashed = hash_password("mydog123")
print("Hashed:", hashed)

print("Correct password check:", verify_password("mydog123", hashed))
print("Wrong password check:", verify_password("wrongpassword", hashed))

#JWT Tokens part
from app.auth import create_access_token, decode_access_token

token = create_access_token({"user_id": 1})
print("Token:", token)

decoded = decode_access_token(token)
print("Decoded:", decoded)

fake_decoded = decode_access_token(token + "tampered")
print("Tampered token result:", fake_decoded)