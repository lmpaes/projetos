package empresa;

//Classe filha de Moeda

public class Real extends Moeda {
    public Real(double valor) {
        super(valor);
    }

    @Override
    public double converter() {
        return valor; // Retorno de real
    }
}
