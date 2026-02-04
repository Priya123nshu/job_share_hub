import os
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

def get_server_parameters() -> StdioServerParameters:
    """
    Configures and returns the MCP server parameters with authentication.
    """
    # Load environment variables from .env
    env_vars = {}
    try:
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print("Warning: .env file not found")

    # Prepare server environment
    server_env = os.environ.copy()
    if "LINKEDIN_COOKIE" in env_vars:
        server_env["LINKEDIN_COOKIE"] = env_vars["LINKEDIN_COOKIE"]

    # Define the LinkedIn MCP server parameters
    # Uses the local python environment to run the server module
    return StdioServerParameters(
        command=r"E:\mcp_client\.venv\Scripts\python.exe",
        args=["-m", "linkedin_mcp_server"],
        env=server_env
    )

async def search_jobs(session: ClientSession, keywords: str, limit: int = 5, location: str = "Remote", time_posted: str = None) -> list[str]:
    """
    Searches for jobs using the provided session and returns a list of Job URLs.
    
    Args:
        session: The active MCP ClientSession.
        keywords: Search query string.
        limit: Max results to fetch.
        location: Job location filter.
        time_posted: Optional time filter (e.g. "r86400" for 24h).
        
    Returns:
        List of job URL strings.
    """
    print(f"Searching for: '{keywords}'...")
    try:
        args = {
            "keywords": keywords,
            "limit": limit, 
            "location": location
        }
        if time_posted:
            args["time_posted"] = time_posted

        result = await session.call_tool("search_jobs", arguments=args)
        
        job_urls = []
        for content in result.content:
            if content.type == "text":
                try:
                    data = json.loads(content.text)
                    urls = data.get("job_urls", [])
                    job_urls.extend(urls)
                except json.JSONDecodeError:
                    pass
        
        return job_urls

    except Exception as e:
        print(f"Error searching for '{keywords}': {e}")
        return []
