var config = JSON.parse(require('fs').readFileSync('config.json', {encoding:'utf8'}))

var GitHubApi = require("github");
var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    protocol: "https",
    host: "api.github.com",
    timeout: 5000,
    headers: {
        "user-agent": "github-mantisbot"
    }
})

// Authenticate with our user
github.authenticate({
	type: "oauth",
	token: config.oauth_token
})


// Handler for the webhook interface
var createHandler = require('github-webhook-handler')
var handler = createHandler({
	path: '/webhook',
	secret: config.secret
})

var http = require('http')
http.createServer(function (req, res) {
	handler(req, res, function (err) {
		res.statusCode = 404
		res.end('no such location')
	})
}).listen(7777)


handler.on('error', function (err) {
	console.error('Error:', err.message)
})

handler.on('ping', function(event) {
	console.log('Ping!')
})

handler.on('push', function (event) {
	var payload = event.payload
	console.log('Received a push event for %s (%d commits)',
		payload.repository.name,
		payload.commits.length
	)

	var commits = payload.commits
	for (var c = commits.length - 1; c >= 0; c--) {
		var commit = commits[c]

		if (commit.message.slice(0, 20) == "Merge pull request #") {
			commit.message = commit.message.slice(20)
			// alternatively I could get the commit from the api,
			// and check the parents. commit.parents.length
			// will be more than 1 if it is a merge commit
		} else if (commit.message.slice(0, 14) == "Fix GH issue #") {
			commit.message = commit.message.slice(14)
		}

		var issues = commit.message.match(/#\d+(?=\b|[^A-Za-z\d])/g)
		if (issues != null) {
			// Build the comment
			var comment = "Issues mentioned in this commit (" + commit.id + "):\n\n"
			for (var i = 0; i < issues.length; i++) {
				if (issues.indexOf(issues[i]) == i) {
					comment += "* [Issue " + issues[i] + "](" + config.url + issues[i].slice(1) + ")\n"
				}
			};

			// Blocking the user prevents the user from commenting on certain repositories. Not sure about the behaviour with organisations.
			// comment += "\nIf you'd like to stop receiving notifications from me, please visit [my profile](https://github.com/mantisbot) and block me. Sorry!"

			// Create the commit comment
			github.repos.createCommitComment({
				user: payload.repository.owner.name,
				repo: payload.repository.name,
				sha: commit.id,
				commit_id: commit.id,
				body: comment
			}, function(err, res) {
				if (err) {
					console.log(err, JSON.stringify(res))
				}
			})
		}
	};
})