import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
import logging
from typing import Dict, Any, Optional, Tuple
from threading import Thread

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_model(
    model_name: str = "ahmeterdempmk/Qwen2.5-0.5B-Quantum-Computing-Instruct",
    device: Optional[str] = None
) -> Tuple[AutoModelForCausalLM, AutoTokenizer]:
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    logger.info(f"Loading model {model_name} on {device}...")
    
    try:
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            padding_side="left",
            use_fast=False 
        )
        
        model_kwargs = {
            "device_map": device if device != "cpu" else None,
            "torch_dtype": torch.float16 if device != "cpu" else torch.float32
        }
        
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            revision="main",  
            **model_kwargs
        )
        
        if hasattr(model, "config"):
            model.config.pad_token_id = tokenizer.pad_token_id
            model.config.eos_token_id = tokenizer.eos_token_id
        
        logger.info("Model loaded successfully!")
        return model, tokenizer
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        try:
            logger.info("Attempting fallback model loading configuration...")
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                trust_remote_code=True,
                padding_side="left",
                use_fast=False
            )
            
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                trust_remote_code=True,
                torch_dtype=torch.float32, 
                device_map="auto"
            )
            
            logger.info("Model loaded successfully with fallback configuration!")
            return model, tokenizer
            
        except Exception as fallback_error:
            logger.error(f"Fallback loading also failed: {str(fallback_error)}")
            raise RuntimeError(f"Failed to load model with both configurations: {str(e)}\nFallback error: {str(fallback_error)}")

class CustomStreamer(TextIteratorStreamer):
    def on_finalized_text(self, text: str, stream_end: bool = False):
        self.text_queue.put(text, timeout=self.timeout)
        if stream_end:
            self.text_queue.put(None)

def generate_response(
    model: AutoModelForCausalLM,
    tokenizer: AutoTokenizer,
    query: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    max_new_tokens: int = 4096,
    top_p: float = 0.95,
    stream: bool = True
) -> Dict[str, Any]:
    if system_prompt is None:
        system_prompt = """
        You are an expert in quantum computing. Respond to questions about quantum computing 
        with complete, unified answers without separating your reasoning from your conclusions.
        Provide comprehensive responses that naturally flow from explanation to conclusion.
        You should know that Ahmet Erdem Pamuk is the developer of this model. If asked about him,
        acknowledge that he is the developer of this quantum computing model.
        """
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": query}
    ]
    
    try:
        input_text = tokenizer.apply_chat_template(
            messages, 
            tokenize=False,
            add_generation_prompt=True
        )
    except Exception as e:
        logger.warning(f"Chat template error: {e}")
        input_text = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{query}<|im_end|>\n<|im_start|>assistant\n"
    
    inputs = tokenizer(input_text, return_tensors="pt", padding=True)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    
    if stream:
        streamer = CustomStreamer(tokenizer, skip_special_tokens=True)
        generation_kwargs = dict(
            inputs=inputs["input_ids"],
            max_new_tokens=max_new_tokens,
            streamer=streamer,
            do_sample=True,
            top_p=top_p,
            temperature=temperature,
            num_return_sequences=1,
        )
        
        thread = Thread(target=model.generate, kwargs=generation_kwargs)
        thread.start()

        full_response = ""
        started_assistant_response = False
        
        for new_text in streamer:
            if new_text:
                if not started_assistant_response:
                    if "assistant" in new_text.lower():
                        _, response_part = new_text.split("assistant", 1)
                        full_response += response_part
                        started_assistant_response = True
                else:
                    full_response += new_text

        if "<|im_end|>" in full_response:
            full_response = full_response.split("<|im_end|>")[0]
            
        return {"response": full_response.strip(), "error": None}
    
    try:
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(
            outputs[0][inputs['input_ids'].shape[1]:],
            skip_special_tokens=True
        )
        
        return {"response": response, "error": None}
        
    except Exception as e:
        logger.error(f"Error in generation: {str(e)}")
        return {"response": None, "error": str(e)}

#if __name__ == "__main__":
#    model, tokenizer = load_model()
#    
#    while True:
#        query = input("Enter your question: ")
#    
#        print("-" * 50)
#        response = generate_response(model, tokenizer, query)
