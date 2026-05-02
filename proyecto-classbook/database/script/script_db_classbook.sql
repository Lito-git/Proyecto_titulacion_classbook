-- MySQL Workbench Forward Engineering
-- VERSIÓN FINAL v3 - SIN AMBIGÜEDADES
-- Todos los nombres de columnas son auto-descriptivos

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP SCHEMA IF EXISTS `mydb`;
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8mb4;
USE `mydb`;

-- -----------------------------------------------------
-- Table `mydb`.`roles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`roles` (
  `rol_id`     INT         NOT NULL AUTO_INCREMENT,
  `rol_nombre` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`rol_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `mydb`.`cursos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`cursos` (
  `curso_id`     INT         NOT NULL AUTO_INCREMENT,
  `curso_nombre` VARCHAR(50) NOT NULL,
  `curso_nivel`  VARCHAR(20) NOT NULL,
  PRIMARY KEY (`curso_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `mydb`.`asignaturas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`asignaturas` (
  `asignatura_id`          INT          NOT NULL AUTO_INCREMENT,
  `asignatura_nombre`      VARCHAR(100) NOT NULL,
  `asignatura_descripcion` VARCHAR(500) NULL DEFAULT NULL,
  PRIMARY KEY (`asignatura_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `mydb`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`usuarios` (
  `usuario_id`               INT          NOT NULL AUTO_INCREMENT,
  `usuario_nombre`           VARCHAR(100) NOT NULL,
  `usuario_segundo_nombre`   VARCHAR(100) NULL DEFAULT NULL,
  `usuario_apellido`         VARCHAR(100) NOT NULL,
  `usuario_segundo_apellido` VARCHAR(100) NULL DEFAULT NULL,
  `usuario_email`            VARCHAR(100) NOT NULL UNIQUE,
  `usuario_contrasena`       VARCHAR(255) NOT NULL,
  `usuario_rol_id`           INT          NOT NULL,
  `usuario_fecha_registro`   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_activo`           TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`usuario_id`),
  INDEX `fk_usuarios_roles_idx` (`usuario_rol_id` ASC) VISIBLE,
  CONSTRAINT `fk_usuarios_roles`
    FOREIGN KEY (`usuario_rol_id`)
    REFERENCES `mydb`.`roles` (`rol_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `mydb`.`estudiantes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`estudiantes` (
  `estudiante_id`         INT         NOT NULL AUTO_INCREMENT,
  `estudiante_usuario_id` INT         NOT NULL,
  `estudiante_curso_id`   INT         NOT NULL,
  `estudiante_rut`        VARCHAR(12) NOT NULL UNIQUE,
  `estudiante_fecha_nacimiento` DATE  NULL DEFAULT NULL,
  PRIMARY KEY (`estudiante_id`),
  INDEX `fk_estudiantes_usuarios_idx` (`estudiante_usuario_id` ASC) VISIBLE,
  INDEX `fk_estudiantes_cursos_idx`   (`estudiante_curso_id` ASC) VISIBLE,
  CONSTRAINT `fk_estudiantes_usuarios`
    FOREIGN KEY (`estudiante_usuario_id`)
    REFERENCES `mydb`.`usuarios` (`usuario_id`),
  CONSTRAINT `fk_estudiantes_cursos`
    FOREIGN KEY (`estudiante_curso_id`)
    REFERENCES `mydb`.`cursos` (`curso_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `mydb`.`docente_asignatura`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`docente_asignatura` (
  `docente_asignatura_id`    INT NOT NULL AUTO_INCREMENT,
  `docente_usuario_id`       INT NOT NULL,
  `asignatura_id`            INT NOT NULL,
  `curso_id`                 INT NOT NULL,
  PRIMARY KEY (`docente_asignatura_id`),
  UNIQUE INDEX `uq_docente_asignatura_curso` (`docente_usuario_id` ASC, `asignatura_id` ASC, `curso_id` ASC) VISIBLE,
  INDEX `fk_da_usuarios_idx`    (`docente_usuario_id` ASC) VISIBLE,
  INDEX `fk_da_asignaturas_idx` (`asignatura_id` ASC) VISIBLE,
  INDEX `fk_da_cursos_idx`      (`curso_id` ASC) VISIBLE,
  CONSTRAINT `fk_da_usuarios`
    FOREIGN KEY (`docente_usuario_id`)
    REFERENCES `mydb`.`usuarios` (`usuario_id`),
  CONSTRAINT `fk_da_asignaturas`
    FOREIGN KEY (`asignatura_id`)
    REFERENCES `mydb`.`asignaturas` (`asignatura_id`),
  CONSTRAINT `fk_da_cursos`
    FOREIGN KEY (`curso_id`)
    REFERENCES `mydb`.`cursos` (`curso_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `mydb`.`anotaciones`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`anotaciones` (
  `anotacion_id`          INT          NOT NULL AUTO_INCREMENT,
  `anotacion_estudiante_id` INT        NOT NULL,
  `anotacion_profesor_id`   INT        NOT NULL,
  `anotacion_tipo`        ENUM('positiva','negativa') NOT NULL,
  `anotacion_descripcion` VARCHAR(500) NOT NULL,
  `anotacion_fecha`       DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`anotacion_id`),
  INDEX `fk_anotaciones_estudiantes_idx` (`anotacion_estudiante_id` ASC) VISIBLE,
  INDEX `fk_anotaciones_profesores_idx`  (`anotacion_profesor_id` ASC) VISIBLE,
  CONSTRAINT `fk_anotaciones_estudiante`
    FOREIGN KEY (`anotacion_estudiante_id`)
    REFERENCES `mydb`.`estudiantes` (`estudiante_id`),
  CONSTRAINT `fk_anotaciones_profesor`
    FOREIGN KEY (`anotacion_profesor_id`)
    REFERENCES `mydb`.`usuarios` (`usuario_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `mydb`.`calificaciones`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`calificaciones` (
  `calificacion_id`             INT                                  NOT NULL AUTO_INCREMENT,
  `calificacion_estudiante_id`  INT                                  NOT NULL,
  `calificacion_asignatura_id`  INT                                  NOT NULL,
  `calificacion_curso_id`       INT                                  NOT NULL,
  `calificacion_profesor_id`    INT                                  NOT NULL,
  `calificacion_tipo`           ENUM('prueba','actividad','examen')  NOT NULL,
  `calificacion_numero`         TINYINT                              NOT NULL DEFAULT 1,
  `calificacion_nota`           DECIMAL(3,1)                         NOT NULL,
  `calificacion_fecha_registro` DATETIME                             NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`calificacion_id`),
  CONSTRAINT `chk_calificacion_numero` CHECK (`calificacion_numero` > 0),
  CONSTRAINT `chk_calificacion_nota` CHECK (`calificacion_nota` >= 2.0 AND `calificacion_nota` <= 7.0),
  UNIQUE INDEX `uq_calificacion` (`calificacion_estudiante_id`, `calificacion_asignatura_id`, `calificacion_tipo`, `calificacion_numero`) VISIBLE,
  INDEX `fk_calificaciones_estudiantes_idx` (`calificacion_estudiante_id` ASC) VISIBLE,
  INDEX `fk_calificaciones_asignaturas_idx` (`calificacion_asignatura_id` ASC) VISIBLE,
  INDEX `fk_calificaciones_cursos_idx`      (`calificacion_curso_id` ASC) VISIBLE,
  INDEX `fk_calificaciones_profesores_idx`  (`calificacion_profesor_id` ASC) VISIBLE,
  CONSTRAINT `fk_calificaciones_estudiante`
    FOREIGN KEY (`calificacion_estudiante_id`)
    REFERENCES `mydb`.`estudiantes` (`estudiante_id`),
  CONSTRAINT `fk_calificaciones_asignatura`
    FOREIGN KEY (`calificacion_asignatura_id`)
    REFERENCES `mydb`.`asignaturas` (`asignatura_id`),
  CONSTRAINT `fk_calificaciones_curso`
    FOREIGN KEY (`calificacion_curso_id`)
    REFERENCES `mydb`.`cursos` (`curso_id`),
  CONSTRAINT `fk_calificaciones_profesor`
    FOREIGN KEY (`calificacion_profesor_id`)
    REFERENCES `mydb`.`usuarios` (`usuario_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `mydb`.`historial_cambios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`historial_cambios` (
  `historial_id`               INT          NOT NULL AUTO_INCREMENT,
  `historial_usuario_id`       INT          NOT NULL,
  `historial_registro_id`      INT          NOT NULL,
  `historial_tabla_afectada`   VARCHAR(50)  NOT NULL,
  `historial_tipo_cambio`      ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  `historial_fecha_cambio`     DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  `historial_detalle_anterior` VARCHAR(500) NULL DEFAULT NULL,
  PRIMARY KEY (`historial_id`),
  INDEX `fk_historial_usuarios_idx` (`historial_usuario_id` ASC) VISIBLE,
  CONSTRAINT `fk_historial_usuarios`
    FOREIGN KEY (`historial_usuario_id`)
    REFERENCES `mydb`.`usuarios` (`usuario_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;