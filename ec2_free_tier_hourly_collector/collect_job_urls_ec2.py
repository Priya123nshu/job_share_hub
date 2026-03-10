import asyncio
import os

from mcp import ClientSession
from mcp.client.stdio import stdio_client

from linkedin_utils_ec2 import get_server_parameters, search_jobs

DEFAULT_KEYWORDS = [
    "Artificial Intelligence",
    "react",
    "Machine Learning",
    "GenAI",
    "Internship",
    "Intern",
    "Software Engineer",
]


def _get_keywords() -> list[str]:
    raw = os.getenv("JOB_KEYWORDS", "").strip()
    if not raw:
        return DEFAULT_KEYWORDS
    return [x.strip() for x in raw.split(",") if x.strip()]


async def main() -> None:
    keywords_list = _get_keywords()
    time_filter = os.getenv("JOB_TIME_FILTER", "r3600")
    location = os.getenv("JOB_LOCATION", "remote")
    limit = int(os.getenv("JOB_LIMIT", "10"))
    delay_seconds = float(os.getenv("REQUEST_DELAY_SECONDS", "1"))
    output_file = os.getenv("OUTPUT_FILE", "job_urls.txt")

    all_job_urls: list[str] = []

    print(f"Starting Job Collection for: {keywords_list}")
    print(f"Time Filter={time_filter} Location={location} Limit={limit}")

    server_params = get_server_parameters()

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()

                for keyword in keywords_list:
                    print(f"--- Processing: {keyword} (Time: {time_filter}) ---")
                    urls = await search_jobs(
                        session,
                        keyword,
                        limit=limit,
                        location=location,
                        time_posted=time_filter,
                    )

                    if urls:
                        print(f"    Found {len(urls)} candidates.")
                        all_job_urls.extend(urls)
                    else:
                        print("    No jobs found or error occurred.")

                    await asyncio.sleep(delay_seconds)

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

    print("=" * 60)
    print(f"FINAL COLLECTION: {len(all_job_urls)} TOTAL JOBS FOUND (WITH DUPLICATES)")
    print("=" * 60)

    for i, url in enumerate(all_job_urls, 1):
        print(f"{i}. {url}")

    with open(output_file, "w", encoding="utf-8") as f:
        for url in all_job_urls:
            f.write(f"{url}\n")

    print(f"Saved {len(all_job_urls)} URLs to {output_file}")


if __name__ == "__main__":
    asyncio.run(main())
