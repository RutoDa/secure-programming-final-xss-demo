from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    comment_count = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'{self.user.username} - {self.content[:20]}...'
    
    
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    

class UserLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'post')
        
    def __str__(self):
        return f'{self.user.username} liked {self.post.content[:20]}...'