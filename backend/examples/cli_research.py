"""Simple CLI interface for the CNB knowledge base agent."""
import argparse
from langchain_core.messages import HumanMessage
from agent.graph import graph


def main() -> None:
    """Run the CNB knowledge base agent from the command line."""
    parser = argparse.ArgumentParser(
        description="Run the simplified CNB knowledge base agent"
    )
    parser.add_argument("question", help="Question to ask the knowledge base")
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Number of knowledge base results to retrieve",
    )
    parser.add_argument(
        "--model",
        default="hunyuan-a13b",
        help="Chat model to use for generating answers",
    )
    args = parser.parse_args()

    state = {
        "messages": [HumanMessage(content=args.question)],
    }

    config = {
        "configurable": {
            "top_k_results": args.top_k,
            "chat_model": args.model,
        }
    }

    print(f"🔍 Querying CNB knowledge base for: {args.question}\n")
    result = graph.invoke(state, config)

    messages = result.get("messages", [])
    if messages:
        print("\n📝 Answer:")
        print(messages[-1].content)

        sources = result.get("sources_gathered", [])
        if sources:
            print("\n📚 Sources:")
            for i, source in enumerate(sources, 1):
                print(f"  {i}. {source['path']} (score: {source['score']:.2f})")


if __name__ == "__main__":
    main()
