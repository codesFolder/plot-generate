# Use a lightweight Python version
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app code
COPY . .

# Expose port 3000
EXPOSE 3000

# Run our custom emulator script
CMD ["python", "vercel_emulator.py"]