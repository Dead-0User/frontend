import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/config";
import { Star, Loader2, MessageSquare, User } from "lucide-react";

interface Feedback {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Get Restaurant ID
        const restResponse = await fetch(`${API_BASE_URL}/api/restaurant/current`, {
          headers: authHeader,
        });
        const restData = await restResponse.json();

        if (restData.success && restData.restaurant) {
          const restaurantId = restData.restaurant.id || restData.restaurant._id;

          // 2. Get Feedback
          const feedbackResponse = await fetch(`${API_BASE_URL}/api/feedback/${restaurantId}`, {
            headers: authHeader, // Even if public, good practice or in case I protect it later
          });
          const feedbackData = await feedbackResponse.json();

          if (feedbackData.success) {
            setFeedbacks(feedbackData.data);

            // Calculate stats
            if (feedbackData.data.length > 0) {
              const totalRating = feedbackData.data.reduce((acc: number, curr: Feedback) => acc + curr.rating, 0);
              setStats({
                average: parseFloat((totalRating / feedbackData.data.length).toFixed(1)),
                total: feedbackData.data.length
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Customer Feedback</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Stats Card */}
        <Card className="card-glass border-0 md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-6">
            <div className="text-5xl font-bold text-foreground mb-2">{stats.average || 0}</div>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-5 h-5 ${star <= Math.round(stats.average) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <p className="text-muted-foreground text-sm">{stats.total} total reviews</p>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <Card className="card-glass border-0 md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {feedbacks.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No feedback received yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {feedbacks.map((item) => (
                  <div key={item._id} className="border-b border-border/50 last:border-0 pb-6 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.customerName}</p>
                          <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-4 h-4 ${star <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 pl-10">{item.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackPage;