# Use an official Python runtime as a parent image for Flask
FROM python:3.10 as flask

# Set the working directory in the container for Flask
WORKDIR /app

# Copy the Flask application files into the container
COPY . /app

# Install Flask and other dependencies for Flask
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 5000 for the Flask application
EXPOSE 5000

# Environment variables for MySQL connection
ENV MYSQL_HOST=mysql
ENV MYSQL_USER=rking
ENV MYSQL_PASSWORD=entrance
ENV MYSQL_DB=users

COPY ./sql-scripts/ /docker-entrypoint-initdb.d/

# Start the Flask application when the container launches
CMD ["flask", "run", "--host=0.0.0.0"]