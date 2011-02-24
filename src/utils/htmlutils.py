_html_escape_table = {
	"&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
    ">": "&gt;",
    "<": "&lt;",
}

def escape(text):
    return "".join(_html_escape_table.get(c,c) for c in text)

def escapeGet(request, key, size, default=""):
	value = request.get(key, "")
	value = value[0:size-1] if len(value) > 0 else default
	return escape(value)