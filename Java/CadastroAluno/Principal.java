package empresa;

public class Principal {

	public static void main(String[] args) {
		
		Aluno a1 = new Aluno("Mario", 111, 0.1, new Curso("Engenharia", 1000));
		
		Aluno a2 = new Aluno("Leandro", 222, 0.2, new Curso("Mecânica", 500));
		
		Aluno a3 = new Aluno("Jorge", 333, 0.15, new Curso("Tecnologia da Informação", 800));
		
		
		a1.info();
		a2.info();
		a3.info();
		
	}

}
