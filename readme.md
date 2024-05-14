# Video Platform API

This project is a simple API for managing a video platform built with Express.js. It allows for uploading, retrieving, and managing videos and their associated comments.

## Features

- **Video Management**: Upload and retrieve videos with associated metadata.
- **Comment System**: Add and delete comments on videos.
- **API Key Security**: Secure endpoints with an API key middleware.
- **File Upload**: Use `multer` for handling image uploads.
- **Static Files**: Serve static images and videos.

## Setup

1. **Clone the repository:**

    ```sh
    git clone https://github.com/yourusername/videoplatform.git
    cd videoplatform
    ```

2. **Install dependencies:**

    ```sh
    npm install
    ```

3. **Create a `.env` file:**

    ```sh
    echo "API_KEY=yourapikey" > .env
    ```

4. **Run the server:**

    ```sh
    npm start
    ```

## API Endpoints

### GET /videos

Retrieve a list of all videos.

### GET /videos/:id

Retrieve a specific video by ID.

### POST /videos

Upload a new video. This endpoint expects an image file and metadata (title, description).

### POST /videos/:id/comments

Add a new comment to a video.

### DELETE /videos/:id/comments/:commentId

Delete a comment from a video.

### POST /videos/:id/like

Like a video.

## Code Explanation

### Middleware

- **CORS**: Enabled to allow cross-origin requests.
- **API Key Middleware**: Secures the endpoints by checking for a valid API key in the query string or headers.

### File Upload

- **Multer**: Configured to store images in the `public/images` directory with a unique filename.

### Data Management

- **readData()**: Reads the JSON file (`data.json`) containing video information.
- **writeData()**: Writes data to the JSON file.

### Routes

- **GET /videos**: Retrieves and returns all videos, with image and video URLs formatted correctly.
- **GET /videos/:id**: Retrieves a specific video by ID.
- **POST /videos**: Handles the upload of a new video, storing metadata and the uploaded image.
- **POST /videos/:id/comments**: Adds a comment to a specific video.
- **DELETE /videos/:id/comments/:commentId**: Deletes a specific comment from a video.
- **POST /videos/:id/like**: Increments the like count of a specific video.

## Challenges

- **Security**: Implementing API key security to protect the endpoints from unauthorized access.
- **File Handling**: Managing file uploads and ensuring files are stored and retrieved correctly.
- **Data Management**: Reading from and writing to a JSON file, ensuring data integrity and proper formatting.

## Improvements

- **Database Integration**: Replace the JSON file with a database for better performance and scalability.
- **Authentication**: Implement user authentication and authorization for more secure and personalized API access.
- **Error Handling**: Improve error handling and validation to provide more informative responses and handle edge cases.

## Contributing

Feel free to open issues or submit pull requests for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
