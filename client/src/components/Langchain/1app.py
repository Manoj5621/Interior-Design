import streamlit as st
from langchain_community.llms import HuggingFaceHub
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from dotenv import load_dotenv
import os
from langchain_huggingface import HuggingFaceEndpoint

load_dotenv()

huggingface_api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
if not huggingface_api_key:
    raise ValueError("Hugging Face API token not found. Please add it to your .env file.")


llm = HuggingFaceHub(
    repo_id="tiiuae/falcon-7b-instruct", 
    model_kwargs={"temperature": 0.7, "max_length": 300},
    huggingfacehub_api_token=huggingface_api_key
)


# Define the LangChain prompt template
template = """
You are an experienced real estate assistant in 2025.
Your task is to calculate the total renovation cost of an apartment in India based on the provided parameters.

Renovation costs include furnishing, painting, and minor changes.

### Input Data:
- **Number of Bedrooms**: {bedrooms}
- **Number of Bathrooms**: {bathrooms}
- **Square Foot Area**: {sqft_area}
- **Locality**: {locality}

### Renovation Cost Data (Per Sqft):
- **Mumbai**: ₹1,200 - ₹2,500
- **Delhi**: ₹1,000 - ₹2,000
- **Bangalore**: ₹800 - ₹1,500
- **Kolkata**: ₹700 - ₹1,300
- **Chennai**: ₹750 - ₹1,400

### Instructions:
1. Identify the city based on the **locality** provided.
2. Multiply the **square foot area** by the **lower and upper bounds** of the renovation cost for the identified city.
3. Display the value as output

For context a 750sqft house in Andheri with 2 bedroom 2 bathroom will cost 13-15lac INR
"""

prompt = PromptTemplate(template=template, input_variables=["bedrooms", "bathrooms", "sqft_area", "sqft_cost", "locality"])
chain = LLMChain(llm=llm, prompt=prompt)


st.title("House Renovation Cost Estimator")

bedrooms = st.number_input("Number of Bedrooms", min_value=1, step=1, value=2)
bathrooms = st.number_input("Number of Bathrooms", min_value=1, step=1, value=1)
sqft_area = st.number_input("Square Footage Area (sqft)", min_value=100.0, step=10.0, value=1000.0)
sqft_cost = st.number_input("Cost per Square Foot (INR)", min_value=1.0, step=1.0, value=50.0)
locality = st.text_input("Locality (e.g., Bandra, Juhu)", "Bandra")

if st.button("Calculate Renovation Cost"):
    with st.spinner("Calculating..."):
        try:
            result = chain.run({
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "sqft_area": sqft_area,
                "sqft_cost": sqft_cost,
                "locality": locality
            })
            st.subheader("Renovation Cost Estimate:")
            st.write(result)
        except Exception as e:
            st.error(f"An error occurred: {e}")
