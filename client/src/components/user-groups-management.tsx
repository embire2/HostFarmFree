import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserGroup {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  maxHostingAccounts: number;
  maxDevices: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  username: string;
  email: string | null;
  role: string;
  userGroupId: number | null;
  createdAt: string;
}

export default function UserGroupsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    displayName: "",
    description: "",
    maxHostingAccounts: 2,
    maxDevices: 2,
    isActive: true,
  });

  // Fetch user groups
  const { data: userGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ["admin/user-groups"],
    queryFn: async () => {
      const response = await fetch("/api/admin/user-groups");
      if (!response.ok) throw new Error("Failed to fetch user groups");
      return response.json();
    },
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Create user group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof newGroupData) => {
      const response = await fetch("/api/admin/user-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });
      if (!response.ok) throw new Error("Failed to create user group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin/user-groups"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "User group created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof newGroupData> }) => {
      const response = await fetch(`/api/admin/user-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update user group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin/user-groups"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "User group updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/user-groups/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin/user-groups"] });
      toast({
        title: "Success",
        description: "User group deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign user to group mutation
  const assignUserMutation = useMutation({
    mutationFn: async ({ userId, userGroupId }: { userId: number; userGroupId: number }) => {
      const response = await fetch(`/api/admin/users/${userId}/assign-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGroupId }),
      });
      if (!response.ok) throw new Error("Failed to assign user to group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin/users"] });
      toast({
        title: "Success",
        description: "User assigned to group successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewGroupData({
      name: "",
      displayName: "",
      description: "",
      maxHostingAccounts: 2,
      maxDevices: 2,
      isActive: true,
    });
    setSelectedGroup(null);
    setIsEditMode(false);
  };

  const handleEdit = (group: UserGroup) => {
    setSelectedGroup(group);
    setNewGroupData({
      name: group.name,
      displayName: group.displayName,
      description: group.description || "",
      maxHostingAccounts: group.maxHostingAccounts,
      maxDevices: group.maxDevices,
      isActive: group.isActive,
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (isEditMode && selectedGroup) {
      updateGroupMutation.mutate({ id: selectedGroup.id, data: newGroupData });
    } else {
      createGroupMutation.mutate(newGroupData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this user group?")) {
      deleteGroupMutation.mutate(id);
    }
  };

  const handleAssignUser = (userId: number, userGroupId: number) => {
    assignUserMutation.mutate({ userId, userGroupId });
  };

  const getUserCountByGroup = (groupId: number) => {
    return users.filter((user: User) => user.userGroupId === groupId).length;
  };

  if (isLoadingGroups) {
    return <div className="p-6">Loading user groups...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">User Groups Management</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit User Group" : "Create New User Group"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Update the user group settings below."
                  : "Create a new user group with custom limits and permissions."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  placeholder="free, donor, premium"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="displayName" className="text-right">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={newGroupData.displayName}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="col-span-3"
                  placeholder="Free User, Donor, Premium"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  placeholder="Description of the user group"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxHostingAccounts" className="text-right">
                  Max Hosting Accounts
                </Label>
                <Input
                  id="maxHostingAccounts"
                  type="number"
                  value={newGroupData.maxHostingAccounts}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, maxHostingAccounts: parseInt(e.target.value) }))}
                  className="col-span-3"
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxDevices" className="text-right">
                  Max Devices
                </Label>
                <Input
                  id="maxDevices"
                  type="number"
                  value={newGroupData.maxDevices}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, maxDevices: parseInt(e.target.value) }))}
                  className="col-span-3"
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Active
                </Label>
                <Switch
                  id="isActive"
                  checked={newGroupData.isActive}
                  onCheckedChange={(checked) => setNewGroupData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
              >
                {isEditMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Groups Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Max Hosting</TableHead>
              <TableHead>Max Devices</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userGroups.map((group: UserGroup) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.displayName}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {group.description || "—"}
                </TableCell>
                <TableCell>{group.maxHostingAccounts}</TableCell>
                <TableCell>{group.maxDevices}</TableCell>
                <TableCell>{getUserCountByGroup(group.id)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    group.isActive 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}>
                    {group.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(group.id)}
                      disabled={group.name === "Free" || group.name === "Donor"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* User Assignment Section */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5" />
          <h3 className="text-lg font-semibold">User Group Assignments</h3>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {users.map((user: User) => (
            <div key={user.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <span className="font-medium">{user.username}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {user.email || "No email"}
                </span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  user.role === "admin" 
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                }`}>
                  {user.role}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={user.userGroupId || ""}
                  onChange={(e) => {
                    const groupId = parseInt(e.target.value);
                    if (groupId) {
                      handleAssignUser(user.id, groupId);
                    }
                  }}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="">No Group</option>
                  {userGroups.map((group: UserGroup) => (
                    <option key={group.id} value={group.id}>
                      {group.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}