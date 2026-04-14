"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Reply, User } from "lucide-react"
import { mockComments, type Comment } from "@/lib/blog-data"
import { Textarea } from "./ui/textarea"

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(mockComments)
  const [newComment, setNewComment] = useState("")
  const [newAuthor, setNewAuthor] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [replyAuthor, setReplyAuthor] = useState("")

  const postComments = comments.filter((comment) => comment.postId === postId)
  const topLevelComments = postComments.filter((comment) => !comment.parentId)

  const getReplies = (commentId: string) => {
    return postComments.filter((comment) => comment.parentId === commentId)
  }

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !newAuthor.trim()) return

    const comment: Comment = {
      id: `c${Date.now()}`,
      postId,
      author: newAuthor,
      content: newComment,
      createdAt: new Date().toISOString(),
    }

    setComments((prev) => [...prev, comment])
    setNewComment("")
    setNewAuthor("")
  }

  const handleSubmitReply = (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!replyContent.trim() || !replyAuthor.trim()) return

    const reply: Comment = {
      id: `c${Date.now()}`,
      postId,
      author: replyAuthor,
      content: replyContent,
      createdAt: new Date().toISOString(),
      parentId,
    }

    setComments((prev) => [...prev, reply])
    setReplyContent("")
    setReplyAuthor("")
    setReplyingTo(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Comments ({postComments.length})</h2>
      </div>

      {/* Add New Comment */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Leave a Comment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Input placeholder="Your name" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} required />
            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              required
            />
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Post Comment
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-6">
        {topLevelComments.map((comment) => (
          <div key={comment.id}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-foreground">{comment.author}</span>
                      <span className="text-sm text-muted-foreground">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-foreground leading-relaxed mb-3">{comment.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-primary hover:text-primary/80"
                    >
                      <Reply className="w-4 h-4 mr-1" />
                      Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <Card className="ml-12 mt-4">
                <CardContent className="p-4">
                  <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="space-y-3">
                    <Input
                      placeholder="Your name"
                      value={replyAuthor}
                      onChange={(e) => setReplyAuthor(e.target.value)}
                      required
                    />
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90">
                        Reply
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Replies */}
            {getReplies(comment.id).map((reply) => (
              <Card key={reply.id} className="ml-12 mt-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-foreground">{reply.author}</span>
                        <span className="text-sm text-muted-foreground">{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{reply.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>

      {postComments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
