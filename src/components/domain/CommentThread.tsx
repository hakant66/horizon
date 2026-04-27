import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CommentThread({
  comments,
}: {
  comments: { id: string; author: string; comment: string; createdAt: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {comments.map((item) => (
          <div key={item.id} className="rounded border border-slate-200 p-3">
            <p className="text-sm font-medium">{item.author}</p>
            <p className="text-sm text-slate-700">{item.comment}</p>
            <p className="text-xs text-slate-500">{item.createdAt}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
