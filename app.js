var http = require('http')
var createHandler = require('github-webhook-handler')
var handler = createHandler({
	path: '/webhook',
	secret: require('fs').readFileSync('secret',{encoding:'utf8'}).slice(0, -1)
})

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
	console.log('Received a push event for %s (%d commits)',
		event.payload.repository.name,
		event.payload.commits.length
	)

	var commits = event.payload.commits
	for (var i = commits.length - 1; i >= 0; i--) {
		var commit = commits[i]
		console.log('"%s"', commit.message)
		
		var issues = commit.message.match(/#\d+/g)
		if (issues != null) {
			processIssues(commit, issues)
		}
	};
})

function processIssues(commit, issues) {
	var msg = "Issues mentioned in this commit:\n\n"
	for (var i = 0; i < issues.length; i++) {
		msg += "* [Issue " + issues[i] + "](https://bugs.mtasa.com/view.php?id=" + issues[i].slice(1) + ")\n"
	};
	console.log(msg)
}