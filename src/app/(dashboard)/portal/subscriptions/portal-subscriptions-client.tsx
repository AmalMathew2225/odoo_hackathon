"use client";

import { Pause, Play, RotateCcw, XCircle } from "lucide-react";
import { useTransition } from "react";
import {
  renewSubscriptionAction,
  transitionSubscriptionAction,
} from "@/actions/subscriptions";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPaiseToINR } from "@/lib/billing/pricing";

export function PortalSubscriptionsClient({
  subscriptions,
}: {
  subscriptions: any[];
}) {
  const [isPending, startTransition] = useTransition();

  const handlePause = (id: string) => {
    startTransition(async () => {
      try {
        await transitionSubscriptionAction(id, "paused");
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleResume = (id: string) => {
    startTransition(async () => {
      try {
        await transitionSubscriptionAction(id, "active");
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleRenew = (id: string) => {
    startTransition(async () => {
      try {
        await renewSubscriptionAction(id);
        alert("Subscription renewed successfully for +1 term!");
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleClose = (id: string) => {
    if (!confirm("Are you sure you want to terminate this subscription?"))
      return;
    startTransition(async () => {
      try {
        await transitionSubscriptionAction(id, "closed");
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          My Active Subscriptions
        </h1>
        <p className="text-xs text-neutral-500">
          Manage your software services, pause billing, or request renewals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {subscriptions.length === 0 ? (
          <div className="col-span-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center text-xs text-neutral-500">
            You do not currently have any active subscriptions. Please contact
            sales to provision a contract.
          </div>
        ) : (
          subscriptions.map((s) => {
            const plan = s.plans;
            const line = s.subscription_lines?.[0];

            return (
              <div
                key={s.id}
                className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                      CONTRACT {s.subscription_number}
                    </span>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                      {line?.products?.name || plan?.name}
                    </h3>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
                  <div className="flex justify-between text-neutral-500">
                    <span>Plan Tier:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {plan?.name} ({plan?.billing_period})
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Recurring Rate:</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {formatPaiseToINR(line?.amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Next Automated Billing:</span>
                    <span className="font-mono">
                      {s.next_billing_date || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Contract Expiry:</span>
                    <span className="font-mono">
                      {s.expiry_date || "Continuous"}
                    </span>
                  </div>
                </div>

                {/* Self-Service Controls */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                  {s.status === "active" && plan?.can_pause && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePause(s.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5"
                    >
                      <Pause className="h-3 w-3" />
                      <span>Pause Service</span>
                    </Button>
                  )}

                  {s.status === "paused" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleResume(s.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5"
                    >
                      <Play className="h-3 w-3" />
                      <span>Resume Service</span>
                    </Button>
                  )}

                  {s.status === "active" && plan?.can_renew && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRenew(s.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Renew (+1 Term)</span>
                    </Button>
                  )}

                  {s.status !== "closed" && plan?.can_close_early && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleClose(s.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5"
                    >
                      <XCircle className="h-3 w-3" />
                      <span>Close Contract</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
