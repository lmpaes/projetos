package empresa;

public class Aluno {
	
	String nome;
	int matricula;
	double desconto;
	Curso curso;
	public Aluno(String nome, int matricula, double desconto, Curso curso) {
		super();
		this.nome = nome;
		this.matricula = matricula;
		this.desconto = desconto;
		this.curso = curso;
	}
	
	void info() {
		System.out.println("Nome do aluno: " + nome);
		System.out.println("Matricula do aluno: " + matricula);
		System.out.println("Desconto do aluno: " + desconto);
		System.out.println("Pagamento do aluno: " + pagamento());
		curso.info();
	}
	
	double pagamento() {
		return curso.mensalidade*(1 - desconto);
		
	}

}
