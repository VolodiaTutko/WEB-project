import numpy as np

def generate_dijkstra_matrix(num_nodes, min_weight, max_weight):
    matrix = np.random.randint(min_weight, max_weight, (num_nodes, num_nodes))
    np.fill_diagonal(matrix, 0)

    return matrix

def write_matrix_to_file(matrix, file_path):
    with open(file_path, 'w') as file:
        for row in matrix:
            row_str = ','.join(map(str, row))
            file.write(row_str + '\n')

num_nodes = 10000
min_weight = 0
max_weight = 10

dijkstra_matrix = generate_dijkstra_matrix(num_nodes, min_weight, max_weight)

file_path = "dijkstraMatrix.csv"  
write_matrix_to_file(dijkstra_matrix, file_path)

