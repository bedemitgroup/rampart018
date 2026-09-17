using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BedemApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAssemblyZapisnicarAndMinutes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MinutesText",
                table: "AssemblyTopics",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "MinutesUpdatedAt",
                table: "AssemblyTopics",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinutesUpdatedByUserId",
                table: "AssemblyTopics",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ZapisnicarUserId",
                table: "AssemblySessions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssemblyTopics_MinutesUpdatedByUserId",
                table: "AssemblyTopics",
                column: "MinutesUpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AssemblySessions_ZapisnicarUserId",
                table: "AssemblySessions",
                column: "ZapisnicarUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssemblySessions_Users_ZapisnicarUserId",
                table: "AssemblySessions",
                column: "ZapisnicarUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AssemblyTopics_Users_MinutesUpdatedByUserId",
                table: "AssemblyTopics",
                column: "MinutesUpdatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssemblySessions_Users_ZapisnicarUserId",
                table: "AssemblySessions");

            migrationBuilder.DropForeignKey(
                name: "FK_AssemblyTopics_Users_MinutesUpdatedByUserId",
                table: "AssemblyTopics");

            migrationBuilder.DropIndex(
                name: "IX_AssemblyTopics_MinutesUpdatedByUserId",
                table: "AssemblyTopics");

            migrationBuilder.DropIndex(
                name: "IX_AssemblySessions_ZapisnicarUserId",
                table: "AssemblySessions");

            migrationBuilder.DropColumn(
                name: "MinutesText",
                table: "AssemblyTopics");

            migrationBuilder.DropColumn(
                name: "MinutesUpdatedAt",
                table: "AssemblyTopics");

            migrationBuilder.DropColumn(
                name: "MinutesUpdatedByUserId",
                table: "AssemblyTopics");

            migrationBuilder.DropColumn(
                name: "ZapisnicarUserId",
                table: "AssemblySessions");
        }
    }
}
