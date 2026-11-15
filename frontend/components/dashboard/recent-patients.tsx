import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/relative-time";

interface RecentPatient {
  _id: string;
  patientCode: string;
  name: string;
  gender: string;
  isActive: boolean;
  createdAt: string;
}

export function RecentPatients({ patients }: { patients: RecentPatient[] }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <h3 className="text-base font-semibold mb-3">Recent patients</h3>
      {patients.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No patients registered yet</p>
      ) : (
        <table className="w-full text-sm text-left">
          <thead className="text-muted-foreground text-xs font-medium">
            <tr>
              <th className="pb-2">Patient</th>
              <th className="pb-2">Code</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 text-right">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.map((p) => (
              <tr key={p._id} className="h-[44px]">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={p.name} size={28} />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="py-2 font-mono text-xs">{p.patientCode}</td>
                <td className="py-2">
                  <Badge variant={p.isActive ? "success" : "muted"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="py-2 text-right text-muted-foreground text-xs">{relativeTime(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}