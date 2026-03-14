from rest_framework import permissions

class IsManagerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow Inventory Managers to edit or create.
    Warehouse Staff can only view (GET requests).
    """
    def hasattr_group(self, user, group_name):
        return user.groups.filter(name=group_name).exists()

    def has_permission(self, request, view):
        # SAFE_METHODS are GET, HEAD, OPTIONS (Viewing data)
        # Everyone logged in is allowed to view data
        if request.method in permissions.SAFE_METHODS:
            return True

        # If it's a POST, PUT, or DELETE, they MUST be in the "Manager" group
        return self.hasattr_group(request.user, 'Manager') or request.user.is_superuser