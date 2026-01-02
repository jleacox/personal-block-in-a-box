# Setting Up Remote Repository

## Create Private GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. **Repository name**: `personal-block-in-a-box`
3. **Description**: `Personal implementation of Block's MCP server architecture for productivity automation`
4. **Visibility**: ⚠️ **Private** (keep it private for now)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

## Add Remote and Push

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/personal-block-in-a-box.git

# Rename branch to main (if needed)
git branch -M main

# Push to remote
git push -u origin main
```

## Alternative: Using SSH

If you prefer SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/personal-block-in-a-box.git
git push -u origin main
```

## Verify

After pushing:

```bash
# Check remote
git remote -v

# Should show:
# origin  https://github.com/YOUR_USERNAME/personal-block-in-a-box.git (fetch)
# origin  https://github.com/YOUR_USERNAME/personal-block-in-a-box.git (push)
```

## Next Steps

Once the remote is set up:
- ✅ All future commits can be pushed with `git push`
- ✅ Repository is private (only you can see it)
- ✅ Can make it public later if desired

