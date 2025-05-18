from django.contrib import admin
from .models import Post, Comment, UserLike



class PostAdmin(admin.ModelAdmin):
    list_display = ('user', 'content', 'comment_count', 'likes', 'created_at')
    search_fields = ['content', 'user__username']
    list_filter = ('created_at',)

class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'content', 'created_at')
    search_fields = ['content', 'user__username']
    list_filter = ('created_at',)

class UserLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at')
    search_fields = ['user__username', 'post__content']
    list_filter = ('created_at',)

admin.site.register(Post, PostAdmin)
admin.site.register(Comment, CommentAdmin)
admin.site.register(UserLike, UserLikeAdmin)
