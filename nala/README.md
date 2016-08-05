# NALA
 
*Non-deterministic Artificial Learning Algorithm*
  
  ![NALA 1.0. Voice Input :: Non Deterministic Output](https://raw.githubusercontent.com/sdesalas/nala/master/NALA.1.0.jpg)
  
  NALA is a javascript non-deterministic input-response algorithm
  for electronic devices.
  
  NALA needs to learn in order to become effective. It does this by
  having certain input-response pairs strengthened by means positive input 
  (ie voice: 'well done'), and other input-response pairs weakened by 
  negative input (ie voice: 'oh no! dont do that!').
  
  If NALA does not receive positive or negative reinforcement then all of its 
  output responses will be random.
  
  NALA is meant to be executed inside the node.js environment on linux by a 
  microcontroller command-line wrapper, so that it has 2-way access
  from microcontroller to node and vice-versa. This allows for the allocation 
  of greater computing resources available on the linux CPU to tasks such as 
  processing input and reflection, as well as electronics heavy-lifting 
  for sensor data (input) and signal output (response) using
  the microcontroller.
  
  Tom Igoe's Arduino Yun BridgeToNode examples provided the starting basis
  for the 2-way communication used by NALA.
  
  https://github.com/tigoe/BridgeExamples/tree/master/BridgeToNode
