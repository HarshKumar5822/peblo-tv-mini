from fastapi import Header, HTTPException, status, Depends
from typing import Optional
from app.schemas import User

def get_current_user(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_role: Optional[str] = Header(None, alias="X-Role"),
    authorization: Optional[str] = Header(None)
) -> User:
    # Role resolution order: X-Role -> X-User-Role -> Authorization Bearer token -> default editor
    role = "editor"
    username = "content_editor"

    if x_role:
        role = x_role.lower()
    elif x_user_role:
        role = x_user_role.lower()
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        if "admin" in token.lower():
            role = "admin"
            username = "admin_user"
        elif "editor" in token.lower():
            role = "editor"
            username = "editor_user"

    if role not in ["editor", "admin"]:
        role = "editor"

    if role == "admin":
        username = "admin_user"

    return User(username=username, role=role)


def require_role(allowed_roles: list[str]):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: role '{user.role}' is not authorized. Required: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker
