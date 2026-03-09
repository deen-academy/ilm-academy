import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, GraduationCap, UserCog } from "lucide-react";
import { useState } from "react";

type UserWithRoles = {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  roles: string[];
};

const roleBadge = (role: string) => {
  switch (role) {
    case "admin":
      return <Badge variant="destructive" className="gap-1"><ShieldCheck className="h-3 w-3" />Admin</Badge>;
    case "teacher":
      return <Badge variant="secondary" className="gap-1"><GraduationCap className="h-3 w-3" />Teacher</Badge>;
    default:
      return <Badge variant="outline" className="gap-1"><UserCog className="h-3 w-3" />Student</Badge>;
  }
};

const Students = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, created_at")
        .order("created_at", { ascending: false });
      if (!profiles?.length) return [];

      const ids = profiles.map((p) => p.id);
      const { data: allRoles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);

      const roleMap = new Map<string, string[]>();
      allRoles?.forEach((r) => {
        const list = roleMap.get(r.user_id) || [];
        list.push(r.role);
        roleMap.set(r.user_id, list);
      });

      return profiles.map((p) => ({
        ...p,
        roles: roleMap.get(p.id) || ["student"],
      })) as UserWithRoles[];
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });
      if (error) {
        if (error.code === "23505") throw new Error("User already has this role");
        throw error;
      }
    },
    onSuccess: (_, { role }) => {
      qc.invalidateQueries({ queryKey: ["admin-all-users"] });
      qc.invalidateQueries({ queryKey: ["admin-teachers"] });
      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} role granted`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);
      if (error) throw error;
    },
    onSuccess: (_, { role }) => {
      qc.invalidateQueries({ queryKey: ["admin-all-users"] });
      qc.invalidateQueries({ queryKey: ["admin-teachers"] });
      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} role removed`);
    },
    onError: () => toast.error("Failed to remove role"),
  });

  const filtered = users?.filter((u) => {
    if (filter === "all") return true;
    return u.roles.includes(filter);
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">User Management</h1>
          <p className="text-muted-foreground">View all users and manage their roles</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="teacher">Teachers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !filtered?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found</TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || "—"}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            if (u.roles.length <= 1) {
                              toast.error("Cannot remove the only role");
                              return;
                            }
                            removeRole.mutate({ userId: u.id, role: r });
                          }}
                          title={`Click to remove ${r} role`}
                          className="cursor-pointer hover:opacity-70 transition-opacity"
                        >
                          {roleBadge(r)}
                        </button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {!u.roles.includes("teacher") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addRole.mutate({ userId: u.id, role: "teacher" })}
                          disabled={addRole.isPending}
                        >
                          <GraduationCap className="mr-1 h-3 w-3" />Teacher
                        </Button>
                      )}
                      {!u.roles.includes("admin") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addRole.mutate({ userId: u.id, role: "admin" })}
                          disabled={addRole.isPending}
                        >
                          <ShieldCheck className="mr-1 h-3 w-3" />Admin
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default Students;
