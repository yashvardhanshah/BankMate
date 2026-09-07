from app.auth import hash_password, verify_password

hashed = hash_password("mydog123")
print("Hashed:", hashed)

print("Correct password check:", verify_password("mydog123", hashed))
print("Wrong password check:", verify_password("wrongpassword", hashed))