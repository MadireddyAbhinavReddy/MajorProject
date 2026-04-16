import streamlit as st
import requests
import json

# --- CONFIGURATION ---
BACKEND_URL = "http://localhost:8000/chat"
st.set_page_config(page_title="Clarity.AI Policy Librarian", page_icon="🛡️", layout="centered")

# --- CUSTOM CSS FOR SOURCE TAGS ---
st.markdown("""
    <style>
    .source-tag {
        display: inline-block;
        padding: 2px 10px;
        margin: 4px;
        border-radius: 12px;
        background-color: #e1f5fe;
        color: #01579b;
        font-size: 0.8rem;
        border: 1px solid #b3e5fc;
    }
    </style>
""", unsafe_allow_html=True)

# --- SIDEBAR ---
with st.sidebar:
    st.title("🛡️ Policy Assistant")
    st.info("I help you navigate Indian Environmental Policies using RAG (Retrieval-Augmented Generation).")
    st.markdown("### 📄 Currently Indexed:")
    st.write("- MoES Climate Assessment 2026")
    st.write("- Plastic Waste Amendment 2024")
    st.write("- Environment Protection Act 1986")
    
    if st.button("Clear Chat History"):
        st.session_state.messages = []
        st.rerun()

# --- CHAT INTERFACE ---
st.title("Clarity.AI Librarian")
st.caption("Ask me about pollution norms, legal penalties, or climate trends in India.")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages from history on app rerun
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "sources" in message:
            st.markdown("---")
            for src in message["sources"]:
                st.markdown(f'<span class="source-tag">📄 {src}</span>', unsafe_allow_html=True)

# React to user input
if prompt := st.chat_input("What is the penalty for air pollution?"):
    # Display user message
    st.chat_message("user").markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Display assistant response
    with st.chat_message("assistant"):
        # 1. Loading State (The Librarian at work)
        with st.status("Librarian searching files...", expanded=False) as status:
            try:
                response = requests.post(BACKEND_URL, json={"query": prompt})
                if response.status_code == 200:
                    data = response.json()
                    status.update(label="Information retrieved!", state="complete", expanded=False)
                    
                    answer = data.get("answer", "No answer found.")
                    sources = data.get("sources", [])
                    
                    # 2. Display the Answer
                    st.markdown(answer)
                    
                    # 3. Display Source Tags
                    if sources:
                        st.markdown("---")
                        for src in sources:
                            st.markdown(f'<span class="source-tag">📄 {src}</span>', unsafe_allow_html=True)
                    
                    # Save to history
                    st.session_state.messages.append({
                        "role": "assistant", 
                        "content": answer, 
                        "sources": sources
                    })
                else:
                    st.error(f"Backend Error: {response.status_code}")
            except Exception as e:
                st.error(f"Could not connect to backend: {e}")