import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut, Mail, Clock } from "lucide-react";

export const UpgradePlanOverlay = () => {
    const { logout, user } = useAuth();

    return (
        <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center p-4">
            <Card className="max-w-lg w-full shadow-2xl border-2">
                <CardContent className="p-8 text-center space-y-6">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 mb-2">
                        <AlertCircle className="h-10 w-10 text-warning" />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-foreground">
                            Account Pending Approval
                        </h2>
                        <p className="text-muted-foreground">
                            Your account is currently under review
                        </p>
                    </div>

                    {/* Message */}
                    <div className="bg-muted/50 rounded-lg p-6 space-y-4 text-left">
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-sm">What's happening?</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Our team is reviewing your registration. This typically takes 24-48 hours.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-sm">Need help?</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Contact us at{" "}
                                    <a
                                        href="mailto:support@yourapp.com"
                                        className="text-primary hover:underline"
                                    >
                                        support@yourapp.com
                                    </a>
                                </p>
                            </div>
                        </div>

                        {user?.email && (
                            <div className="pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground">
                                    Registered as: <span className="font-medium text-foreground">{user.email}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    <Button
                        onClick={logout}
                        variant="outline"
                        className="w-full gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
