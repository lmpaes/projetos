/*Projeto desenvolvido para simular uma clínica medica para estudo de linguagem SQL, não contem nomes ou informações reais*/

create database clinica;
use clinica;

create table especialidade (
idEspecialidade int primary key auto_increment,
nomeEspecialidade varchar(50) not null
);

insert into especialidade (nomeEspecialidade) value
('Cardiologia'), ('Pediatria'), ('Dermatologia'), ('Ortopedia'), ('Oftalmologia'),('Psiquiatria')
;

create table convenio (
idConvenio int primary key auto_increment,
empresa varchar(50) not null
);

insert into convenio (empresa)
values ('Sem convenio'), ('Unimed'),('Porto Seguro'),('Notre Dame'), ('Bradesco')
;

create table cidade (
idCidade int primary key auto_increment,
nomeCidade varchar(50),
estado char(02)
);

insert into cidade (nomeCidade, estado)
values ('São Paulo','SP'), ('Itapevi', 'SP'),('Jandira','SP'), ('Barueri', 'SP'),('Carapicuiba', 'SP')
;

create table medico (
CRM varchar(8) primary key,
nomeMedico varchar(100) not null,
idEspecialidade int not null,
idCidade int not null,
foreign key (idEspecialidade) references especialidade(idEspecialidade),
foreign key (idCidade) references cidade(idCidade)
);

insert into medico (CRM, nomeMedico, idEspecialidade, idCidade) values 
('SP000001','Bruna Santos', 3, 1 ),
('SP000002','Jose Sousa', 1, 2 ),
('SP000003','Erick Oliveira', 1, 1 ),
('SP000004','Raquel Macedo', 2, 5 ), 
('SP000005','Carlo Henrique', 5, 4 ),
('SP000006','Joao Cavalcanti', 4, 3 ),
('SP000007','Evelyn Almeida', 4, 1 ),
('SP000008','Ana Pereira', 6, 2 ),
('SP000009','Otávio Cunha', 5, 2 ),
('SP000010','Cauã Barbosa', 2, 3 ),
('SP000011','Carolina Pereira', 2, 1 ),
('SP000012','Leila Goncalves', 2, 5 )
;

create table paciente (
CPF varchar(11) primary key,
nomePaciente varchar(100) not null,
idCidade int not null,
foreign key (idCidade) references cidade(idCidade)
);

insert into paciente (CPF, nomePaciente, idCidade) values 
('99988877766','Mylena Santos', 2),
('88899977766','Mateus Gonçalvez', 1 ),
('11122244433','Shirley Brandão', 3),
('55544466699','Guilherme Aparecido', 5 ), 
('33355588800','Leonardo Silva', 1),
('71047580565','Rafael Barbosa', 5),
('15436313799','Victor Oliveira', 2),
('59859390325','Carolina Gomes', 4),
('85543399846','Igor Almeida', 3),
('82945917863','Luana Almeida', 2),
('91556472647','Victor Santos', 1),
('88441716608','Alice Rodrigues', 4),
('73201016244','Tiago Santos', 5),
('39203809481','Victor Santos', 5),
('48038263320','Clara Goncalves', 1),
('64746316665','Miguel Ribeiro', 1),
('36226797339','Arthur Oliveira', 1)
;

create table consulta (
idConsulta int primary key auto_increment,
dia date not null,
horario time not null,
CRM varchar(8) not null,
CPF varchar(11) not null,
idConvenio int not null,
foreign key (idConvenio) references convenio(idConvenio),
foreign key (CRM) references medico(CRM),
foreign key (CPF) references paciente(CPF)
);

insert into consulta (dia, horario, CRM, CPF, idConvenio) values 
('2024-08-19','10:00:00', 'SP000002', '88899977766', 4),
('2024-08-19','14:00:00', 'SP000003', '88899977766', 4),
('2024-08-19','12:00:00', 'SP000001', '88899977766', 4),
('2024-08-26','10:30:00', 'SP000001', '88899977766', 4),
('2024-08-19','08:30:00', 'SP000008', '11122244433', 4),
('2024-08-23','08:30:00', 'SP000008', '11122244433', 4),
('2024-08-26','16:00:00', 'SP000011', '11122244433', 4),
('2024-08-30','12:30:00', 'SP000012', '11122244433', 4),
('2024-08-19','14:30:00', 'SP000004', '55544466699', 2),
('2024-08-26','14:30:00', 'SP000004', '55544466699', 2),
('2024-08-30','16:30:00', 'SP000004', '55544466699', 2),
('2024-08-19','16:30:00', 'SP000004', '33355588800', 1),
('2024-08-19','18:30:00', 'SP000007', '33355588800', 1),
('2024-08-19','18:30:00', 'SP000004', '71047580565', 4),
('2024-08-26','18:30:00', 'SP000004', '71047580565', 4),
('2024-08-19','08:00:00', 'SP000005', '15436313799', 3),
('2024-08-26','08:00:00', 'SP000005', '15436313799', 3),
('2024-08-30','14:00:00', 'SP000009', '15436313799', 3),
('2024-08-19','10:00:00', 'SP000001', '59859390325', 3),
('2024-08-26','08:00:00', 'SP000001', '59859390325', 3),
('2024-08-19','08:00:00', 'SP000001', '85543399846', 2),
('2024-08-19','10:00:00', 'SP000008', '85543399846', 2),
('2024-08-19','08:00:00', 'SP000002', '82945917863', 5),
('2024-08-26','12:00:00', 'SP000002', '82945917863', 5),
('2024-08-23','08:00:00', 'SP000002', '82945917863', 5),
('2024-08-19','16:00:00', 'SP000003', '91556472647', 2),
('2024-08-19','18:00:00', 'SP000011', '91556472647', 2),
('2024-08-26','14:00:00', 'SP000012', '91556472647', 2),
('2024-08-20','08:00:00', 'SP000001', '88441716608', 1),
('2024-08-20','10:30:00', 'SP000002', '88441716608', 1),
('2024-08-21','16:30:00', 'SP000003', '88441716608', 1),
('2024-08-20','14:30:00', 'SP000012', '73201016244', 5),
('2024-08-21','18:30:00', 'SP000011', '73201016244', 5),
('2024-08-26','08:30:00', 'SP000008', '73201016244', 5),
('2024-08-24','12:00:00', 'SP000006', '39203809481', 2),
('2024-08-24','14:00:00', 'SP000006', '48038263320', 5),
('2024-08-23','12:00:00', 'SP000005', '48038263320', 5),
('2024-08-24','16:00:00', 'SP000006', '64746316665', 1),
('2024-08-26','10:00:00', 'SP000005', '36226797339', 3),
('2024-08-26','12:00:00', 'SP000003', '36226797339', 3),
('2024-08-26','14:00:00', 'SP000010', '36226797339', 3)
;

/*Select para identificar a quantidade de consultas por especialidade*/
select e.nomeEspecialidade as Especialidade, count(c.idConsulta) as Total_de_Consultas
from consulta c join medico m on c.CRM = m.CRM join especialidade e on m.idEspecialidade = e.idEspecialidade
group by e.nomeEspecialidade
order by Total_de_Consultas desc;

/*Select para analisar as consultas realizadas pelos médicos Pediatras (Especialidade que atendeu o maior número de pacientes)*/
select co.dia as Data_da_Consulta, co.horario as Horario, m.nomeMedico as Medico, m.CRM, p.nomePaciente as Paciente
from consulta co join medico m on co.CRM = m.CRM join especialidade e on m.idEspecialidade = e.idEspecialidade join paciente p on co.CPF = p.CPF where e.nomeEspecialidade = 'Pediatria' order by Medico;
    
/*Select para identificar todos os médicos cadastrados, CRM de cada um, cidade onde moram e especialidade*/
select m.CRM, m.nomeMedico as Medico, e.nomeEspecialidade as Especialidade, c.nomeCidade as Cidade, c.estado as Estado
from medico m join especialidade e on m.idEspecialidade = e.idEspecialidade join cidade c on m.idCidade = c.idCidade
order by Especialidade;

/*Select para identificar a quantidade de médicos especialistas em cada modalidade*/
select e.nomeEspecialidade as Especialidade, COUNT(m.CRM) as Numero_de_Medicos
from especialidade e left join medico m on e.idEspecialidade = m.idEspecialidade
group by e.nomeEspecialidade
order by Numero_de_Medicos desc;

/*Select para identificar qual o dia com mais consultas*/ 
select dia as data, count(*) as Total_de_Consultas
from consulta
group by dia
order by Total_de_Consultas desc;

/*Select para identificar qual convenio com mais consultas*/
select co.empresa as Convenio, count(c.idConsulta) as Total_de_Consultas
from convenio co left join consulta c on co.idConvenio = c.idConvenio
group by co.empresa
order by Total_de_Consultas desc;

/*Select para contabilizar o número de consultas feitas por cada medico*/
select m.nomeMedico as Medico, m.CRM, e.nomeEspecialidade as Especialidade, count(co.idConsulta) as Quant_Consultas
from medico m join consulta co on m.CRM = co.CRM join especialidade e on m.idEspecialidade = e.idEspecialidade
group by m.nomeMedico, m.CRM, e.nomeEspecialidade
order by Quant_Consultas desc;

/*Select para visualizar todas as consultas cadastrada com nome do paciente, dados do médico e dados da consulta*/
select p.nomePaciente as Paciente, m.nomeMedico as Medico, e.nomeEspecialidade as Especialidade, co.dia as Dia, co.horario as Horario
from consulta co join paciente p on co.CPF = p.CPF join medico m on co.CRM = m.CRM 
join especialidade e on m.idEspecialidade = e.idEspecialidade
order by co.dia, co.horario;