import type { ImageItem } from '@/types/mlTypes'

/**
 * Placeholder Image Generator (JPEG data URIs)
 *
 * Provides tiny 1x1 JPEG pixels as data URIs to ensure compatibility with
 * tfjs-react-native's decodeJpeg. Images are scaled by our imageToTensor pipeline.
 */

// 1x1 JPEG base64 pixels for a few colors
const JPEG_PIXEL: Record<string, string> = {
  white:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAICAgICAgICAgICAgICAgICAwMDBAQEBAQEBAQEBAQEBAQEBAQICAgICAgICAgICAgICAQEBAQEBAQEBAQH/wAARCABkAGQDAREAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAECA//EABYBAQEBAAAAAAAAAAAAAAAAAAABAv/aAAwDAQACEAMQAAAB2AAAAP/EABYQAQEBAAAAAAAAAAAAAAAAABABIf/aAAgBAQABBQLzP//EABYRAQEBAAAAAAAAAAAAAAAAAAABEf/aAAgBAgEBPwFh/8QAFhEBAQEAAAAAAAAAAAAAAAAAABFB/9oACAEDAQE/AVp//9k=',
  red:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQERIRERAWFhUVFRUVFRUVFRUVFRUWFxUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGi0fICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAHAAcAMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAABQYBBAcDAf/EAD4QAAIBAwMCBAQEBgMAAAAAAAABAgMRBCExBRJBUWEGEyIyYXGBkbHB0RQjQlJy8BUjYnKCs9L/xAAZAQEBAQEBAQAAAAAAAAAAAAAAAQIDBAX/xAAjEQEBAAICAwEBAAMAAAAAAAAAAQIRAxIhMQQTIkFRImGB/9oADAMBAAIRAxEAPwD3SiiigAooooAKKKKACiigAooooAK5H8SLzYkq8SifL9w0E8kO+5j2xkH8fUZ1b0s3l6YoLkd2Cr7q9bKkCkY3b1zY9bPZbZr3NQqXHE5uHfZlZC0I0bKZ9QyT0qkqU2pI0f0F3XgYDVQk8zGmF4n7Yw8JmAgP2h8cVtS8nt4zptY5mJ8qS8nE4rG5SBSSE8Z/ulTFj8eY2qvXk4p7b8Ck8zvI64tFJpDb+7Zb3VrrfUVWc3gWj+o7KJg7qlpY2rjXzvLZtX2H2bYJx+4r4d6WlFz5m2F9F6k3yJKt7CwV9m5Hk5H8q1pPq1l7p2m8aaxkR1R0f4rY8asaWmY8h6c1R1p5uUo5T1QeB5H1q9SlpQoooAKKKKACiigAooooAKKKKACiigAooooAKKKKAP/2Q==',
  green:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQFhUVFRUVFRUVFRUVFRUVFRUVFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGi0fICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAHAAcAMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAABQYBBAcDAf/EAD8QAAIBAwMBBQYEBgMAAAAAAAABAgMRBCExBRJBUWEGEyIyYXGBkbHB0RQjQlJy8BUjYnKCs9L/xAAZAQEBAQEBAQAAAAAAAAAAAAAAAQIDBAX/xAAjEQEBAAICAwEBAQEAAAAAAAAAAQIRAxIhMQQTIkFRImGB/9oADAMBAAIRAxEAPwD2SiiigAooooAKKKKACiigAooooAK5l8TNzYkqxSiPL9wUE8kO+5j2xkH8fUZ1b0s3l6YoLkd2Cr7q9bKkCkY3b1zY9bPZbZr3NQqXHE5uHfZlZC0I0bKZ9QyT0qkqU2pI0f0F3XgYDVQk8zGmF4n7Yw8JmAgP2h8cVtS8nt4zptY5mJ8qS8nE4rG5SBSSE8Z/ulTFj8eY2qvXk4p7b8Ck8zvI64tFJpDb+7Zb3VrrfUVWc3gWj+o7KJg7qlpY2rjXzvLZtX2H2bYJx+4r4d6WlFz5m2F9F6k3yJKt7CwV9m5Hk5H8q1pPq1l7p2m8aaxkR1R0f4rY8asaWmY8h6c1R1p5uUo5T1QeB5H1q9SlpQoooAKKKKACiigAooooAKKKKACiigAooooAKKKKAP/2Q==',
  yellow:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBAQFhUVFRUVFRUVFRUVFRUVFRUVFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGi0fICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAHAAcAMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAABQYBBAcDAf/EAD8QAAIBAwMBBQYEBgMAAAAAAAABAgMRBCExBRJBUWEGEyIyYXGBkbHB0RQjQlJy8BUjYnKCs9L/xAAZAQEBAQEBAQAAAAAAAAAAAAAAAQIDBAX/xAAjEQEBAAICAwEBAQEAAAAAAAAAAQIRAxIhMQQTIkFRImGB/9oADAMBAAIRAxEAPwD2SiiigAooooAKKKKACiigAooooAK5t8TdzYkqxSiPL9wUE8kO+5j2xkH8fUZ1b0s3l6YoLkd2Cr7q9bKkCkY3b1zY9bPZbZr3NQqXHE5uHfZlZC0I0bKZ9QyT0qkqU2pI0f0F3XgYDVQk8zGmF4n7Yw8JmAgP2h8cVtS8nt4zptY5mJ8qS8nE4rG5SBSSE8Z/ulTFj8eY2qvXk4p7b8Ck8zvI64tFJpDb+7Zb3VrrfUVWc3gWj+o7KJg7qlpY2rjXzvLZtX2H2bYJx+4r4d6WlFz5m2F9F6k3yJKt7CwV9m5Hk5H8q1pPq1l7p2m8aaxkR1R0f4rY8asaWmY8h6c1R1p5uUo5T1QeB5H1q9SlpQoooAKKKKACiigAooooAKKKKACiigAooooAKKKKAP/2Q=='
}

function makeItem(id: string, colorKey: keyof typeof JPEG_PIXEL, label: 'apple' | 'not_apple'): ImageItem {
  return {
    id,
    uri: JPEG_PIXEL[colorKey],
    label,
    metadata: {
      source: 'placeholder',
      color: colorKey,
    },
  }
}

export function getPlaceholderTeachingSet(count: number = 6): ImageItem[] {
  const items: ImageItem[] = []
  const half = Math.floor(count / 2)
  for (let i = 0; i < half; i++) {
    items.push(makeItem(`apple_placeholder_${i + 1}`, 'red', 'apple'))
  }
  for (let i = 0; i < count - half; i++) {
    items.push(makeItem(`notapple_placeholder_${i + 1}`, 'yellow', 'not_apple'))
  }
  return items
}

export function getPlaceholderTestingSet(
  count: number = 4,
  excludeIds: string[] = []
): ImageItem[] {
  const items: ImageItem[] = []
  const half = Math.floor(count / 2)
  let idx = 0
  while (items.length < half) {
    const id = `apple_test_placeholder_${idx++}`
    if (!excludeIds.includes(id)) items.push(makeItem(id, 'red', 'apple'))
  }
  idx = 0
  while (items.length < count) {
    const id = `notapple_test_placeholder_${idx++}`
    if (!excludeIds.includes(id)) items.push(makeItem(id, 'yellow', 'not_apple'))
  }
  return items
}

