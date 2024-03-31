# Import necessary libraries
from skimage.util.shape import view_as_blocks
from skimage import io, transform
import tensorflow as tf
import numpy as np
import os
from PIL import Image
import glob
import re
import tensorflow as tf
from tensorflow import keras

# Function to convert one-hot encoded array to FEN notation
def fen_from_onehot(one_hot):
    piece_symbols = 'PNBRQKpnbrqk'
    output = ''
    for j in range(8):
        for i in range(8):
            if(one_hot[j][i] == 12):
                output += ' '
            else:
                output += piece_symbols[one_hot[j][i]]
        if(j != 7):
            output += '/'

    for i in range(8, 0, -1):
        output = output.replace(' ' * i, str(i))

   
    return output

# Function to process the image
def process_image(img_path):
    downsample_size = 200
    square_size = int(downsample_size / 8)
    img_read = io.imread(img_path)
    img_read = transform.resize(img_read, (downsample_size, downsample_size), mode='constant')
    tiles = view_as_blocks(img_read, block_shape=(square_size, square_size, 3))
    tiles = tiles.squeeze(axis=2)
    return tiles.reshape(64, square_size, square_size, 3)

# Load the trained model
modelf = tf.keras.models.load_model('saved_model.h5')

# Function to predict FEN from image
def predict_fen(image_path):
    processed_image = process_image(image_path)
    pred = modelf.predict(processed_image).argmax(axis=1).reshape(-1, 8, 8)
    fen = fen_from_onehot(pred[0])
    return fen

if __name__ == "__main__":
    import sys
    image_path = sys.argv[1]
    predicted_fen = predict_fen(image_path)
    
    print('Predicted FEN:', predicted_fen)
