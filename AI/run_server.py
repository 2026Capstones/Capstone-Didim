import uvicorn
import logging
import sys

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

if __name__ == "__main__":
    logging.info("Starting AI Interview Analyzer Server with whitelist reload settings...")
    
    try:
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=8000,
            log_level="info"
        )
    except KeyboardInterrupt:
        logging.info("Server stopped by user.")
        sys.exit(0)
    except Exception as e:
        logging.error(f"Failed to start server: {e}")
        sys.exit(1)
