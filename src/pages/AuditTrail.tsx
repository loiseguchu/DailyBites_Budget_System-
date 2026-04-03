import { motion } from "framer-motion";
import { Shield, Clock } from "lucide-react";
import { type AuditEntry } from "@/lib/store";

interface Props {
  entries: AuditEntry[];
}

export default function AuditTrail({ entries }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif">Audit Trail</h1>
        <p className="text-muted-foreground text-sm">Track all system activities and changes.</p>
      </div>

      {entries.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-12 text-center">
          <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No activities recorded yet. Actions will appear here as they happen.</p>
        </motion.div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Performed By</th>
                  <th className="px-5 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 100).map((e, i) => (
                  <motion.tr
                    key={e.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(e.timestamp).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">{e.action}</span>
                    </td>
                    <td className="px-5 py-3">{e.performedBy}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs max-w-[300px] truncate">{e.details}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
