# modules/web_search.py

from ddgs import DDGS

def search_for_example_answers(query: str, num_results: int = 2):
    """
    Performs a targeted web search for high-quality example answers to an interview question.
    """
    # Refine the query to find expert answers
    search_query = f"expert sample answer for interview question: \"{query}\""
    print(f"🌐 Searching for expert answers with query: '{search_query}'")
    
    try:
        with DDGS(timeout=10) as ddgs:
            results = list(ddgs.text(search_query, max_results=num_results))
            
            if not results:
                print("   -> No example answers found.")
                return "No example answers found on the web."
            
            formatted_results = ""
            for i, res in enumerate(results):
                formatted_results += f"Example Answer Source {i+1}:\nTitle: {res.get('title', 'N/A')}\nSnippet: {res.get('body', 'N/A')}\n\n"
            
            print(f"   -> Found {len(results)} example answers.")
            return formatted_results
            
    except Exception as e:
        print(f"💥 Web search failed: {e}")
        return "Web search for example answers failed."