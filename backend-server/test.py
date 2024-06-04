import tensorflow as tf
from tensorflow import keras
from keras.layers import Input, LSTM, Dense
from keras.models import Model
from keras.callbacks import ModelCheckpoint, EarlyStopping

#Dimensionality
dimensionality = 256
#The batch size and number of epochs
batch_size = 256
epochs = 100
#Encoder
encoder_inputs = Input(shape=(None, num_encoder_tokens))
encoder_lstm = LSTM(dimensionality, return_state=True)
encoder_outputs, state_hidden, state_cell = encoder_lstm(encoder_inputs)
encoder_states = [state_hidden, state_cell]
#Decoder
decoder_inputs = Input(shape=(None, num_decoder_tokens))
decoder_lstm = LSTM(dimensionality, return_sequences=True, return_state=True)
decoder_outputs, decoder_state_hidden, decoder_state_cell = decoder_lstm(decoder_inputs, 
                                                                         initial_state=encoder_states)
decoder_dense = Dense(num_decoder_tokens, activation='softmax')
decoder_outputs = decoder_dense(decoder_outputs)

# #Model
training_model = Model([encoder_inputs, decoder_inputs], decoder_outputs)
# #Compiling
training_model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])


checkpoint = ModelCheckpoint(filepath='model.h5', save_best_only=True, verbose=1)
early_stopping = EarlyStopping(monitor='val_loss', patience=3, verbose=1)

# Now, callbacks is a list of the defined callbacks
callbacks = [checkpoint, early_stopping]
#Training
# history = training_model.fit([encoder_input_data, decoder_input_data], decoder_target_data, batch_size = batch_size, epochs = epochs, validation_split = 0.2, callbacks=[my_callbacks])
history = training_model.fit([encoder_input_data, decoder_input_data], 
                             decoder_target_data, batch_size = batch_size, epochs = epochs, 
                             validation_split = 0.2, callbacks=[callbacks])
#training_model.save('training_model.h5')