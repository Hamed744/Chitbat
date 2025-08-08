FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860

# START: OPTIMIZED GUNICORN COMMAND
# This command uses 5 asynchronous 'gevent' workers to handle many concurrent users
# without blocking, and sets a 12-minute timeout for long-running API calls.
CMD ["sh", "-c", "gunicorn --workers ${GUNICORN_WORKERS:-5} --worker-class gevent --bind 0.0.0.0:${PORT:-7860} --timeout ${GUNICORN_TIMEOUT:-720} app:app"]
# END: OPTIMIZED GUNICORN COMMAND
